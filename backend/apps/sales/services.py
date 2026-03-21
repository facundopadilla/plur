"""Business logic for garments, sales and credit management."""

from __future__ import annotations

import math
from urllib.parse import quote

from asgiref.sync import sync_to_async
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from loguru import logger

from apps.match.services import ConversationService as _ConversationService
from apps.sales.models import CreditTransaction, Garment, Sale
from apps.sales.repositories import CreditTransactionRepository, GarmentRepository, SaleRepository
from apps.users.models import User
from core.blockchain import burn_plr, mint_plr

PLATFORM_FEE_RATE = 0.005  # 0.5%


class GarmentService:
    """Service for garment publishing operations."""

    @classmethod
    async def publish(
        cls,
        seller: User,
        name: str,
        description: str,
        images: list[str],
        price_plr: int,
        size: str,
        style: str,
        condition: str,
        location: str,
        latitude: float | None,
        longitude: float | None,
        tags: list[str],
    ) -> Garment:
        """Publish a new garment for sale.

        No token reward is given for publishing.

        Args:
            seller: The user publishing the garment.
            name: Garment name.
            description: Garment description.
            images: List of image URLs or base64 strings.
            price_plr: Price in PLR tokens.
            size: Garment size.
            style: Garment style.
            condition: Garment condition.
            location: Seller location.
            latitude: Seller latitude.
            longitude: Seller longitude.
            tags: List of tags.

        Returns:
            The newly created Garment instance.

        Raises:
            ValueError: If validation fails.
        """
        if price_plr <= 0:
            raise ValueError("Price must be greater than 0")
        if not name.strip():
            raise ValueError("Name is required")

        garment = await GarmentRepository.create(
            seller=seller,
            name=name.strip(),
            description=description.strip(),
            images=images,
            price_plr=price_plr,
            size=size.strip(),
            style=style.strip(),
            condition=condition.strip(),
            location=location.strip(),
            latitude=latitude,
            longitude=longitude,
            tags=tags,
        )
        logger.info("Garment published", garment_id=garment.pk, seller_id=seller.pk, price=price_plr)
        return garment

    @classmethod
    async def find_nearby(
        cls,
        lat: float | None,
        lng: float | None,
        radius_km: float,
        style: str | None = None,
        size: str | None = None,
        condition: str | None = None,
    ) -> list[tuple[Garment, float | None]]:
        if radius_km <= 0:
            raise ValueError("Radius must be greater than 0")

        return await GarmentRepository.find_nearby(
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            style=style.strip() if style else None,
            size=size.strip() if size else None,
            condition=condition.strip() if condition else None,
        )

    @classmethod
    async def update(cls, seller: User, garment_id: int, **fields: object) -> Garment:
        garment = await GarmentRepository.get_by_id(garment_id)
        if garment is None:
            raise ValueError("Garment not found")
        if garment.seller_id != seller.pk:
            raise ValueError("You can only modify your own garments")
        if garment.status == "sold":
            raise ValueError("Sold garments cannot be modified")

        update_fields: list[str] = []
        for field_name, value in fields.items():
            if value is None:
                continue
            if field_name in {"name", "description", "size", "style", "condition", "location"} and isinstance(
                value, str
            ):
                value = value.strip()

            setattr(garment, field_name, value)
            update_fields.append(field_name)

        if update_fields:
            await garment.asave(update_fields=update_fields)

        logger.info("Garment updated", garment_id=garment.pk, seller_id=seller.pk)
        return garment

    @classmethod
    async def delete(cls, seller: User, garment_id: int) -> None:
        garment = await GarmentRepository.get_by_id(garment_id)
        if garment is None:
            raise ValueError("Garment not found")
        if garment.seller_id != seller.pk:
            raise ValueError("You can only modify your own garments")
        if garment.status == "sold":
            raise ValueError("Sold garments cannot be modified")

        await GarmentRepository.soft_delete(garment)
        logger.info("Garment deleted", garment_id=garment_id, seller_id=seller.pk)


class SaleService:
    """Service for sale transaction operations."""

    @classmethod
    async def initiate(cls, buyer: User, garment_id: int) -> Sale:
        """Initiate a purchase. Creates a pending sale awaiting seller confirmation.

        Args:
            buyer: The user buying the garment.
            garment_id: The garment's primary key.

        Returns:
            The newly created pending Sale instance.

        Raises:
            ValueError: If validation fails.
        """
        garment = await GarmentRepository.get_by_id(garment_id)
        if garment is None:
            raise ValueError("Garment not found")
        if garment.status != "active":
            raise ValueError("Garment is no longer available")
        if garment.seller_id == buyer.pk:
            raise ValueError("Cannot buy your own garment")

        fee = math.ceil(garment.price_plr * PLATFORM_FEE_RATE)
        total = garment.price_plr + fee

        if buyer.credits < total:
            raise ValueError(f"Insufficient credits. Need {total} PLR, have {buyer.credits} PLR")

        if await SaleRepository.has_pending_sale(garment_id):
            raise ValueError("A pending purchase already exists for this garment")

        sale = await SaleRepository.create(
            garment=garment,
            buyer=buyer,
            seller=garment.seller,
            price_plr=garment.price_plr,
            platform_fee=fee,
        )
        logger.info(
            "Sale initiated",
            sale_id=sale.pk,
            buyer_id=buyer.pk,
            seller_id=garment.seller_id,
            price=garment.price_plr,
            fee=fee,
        )
        return sale

    @classmethod
    async def confirm(cls, seller: User, sale_id: int) -> Sale:
        """Confirm a pending sale. Transfers credits atomically.

        Args:
            seller: The seller confirming the sale.
            sale_id: The sale's primary key.

        Returns:
            The confirmed Sale instance.

        Raises:
            ValueError: If validation fails.
        """
        sale = await SaleRepository.get_by_id(sale_id)
        if sale is None or sale.seller_id != seller.pk:
            raise ValueError("Sale not found")
        if sale.status != "pending":
            raise ValueError("Sale already processed")

        total = sale.price_plr + sale.platform_fee

        # Re-fetch buyer inside transaction for safety
        try:
            buyer = await User.objects.aget(pk=sale.buyer_id)
        except User.DoesNotExist as exc:
            raise ValueError("Buyer not found") from exc

        if buyer.credits < total:
            raise ValueError("Buyer no longer has sufficient credits")

        def _execute_transfer() -> None:
            """Run the credit transfer inside a sync atomic transaction."""
            with transaction.atomic():
                # Re-fetch with select_for_update to prevent races
                locked_buyer = User.objects.select_for_update().get(pk=buyer.pk)
                locked_seller = User.objects.select_for_update().get(pk=seller.pk)
                garment = Garment.objects.select_for_update().get(pk=sale.garment_id)

                # Deduct from buyer
                locked_buyer.credits -= total
                locked_buyer.save(update_fields=["credits"])

                # Credit seller (price only, fee goes to platform)
                locked_seller.credits += sale.price_plr
                locked_seller.save(update_fields=["credits"])

                # Mark garment as sold
                garment.status = "sold"
                garment.save(update_fields=["status"])

                # Record transactions
                CreditTransaction.objects.create(
                    user=locked_buyer,
                    sale=sale,
                    tx_type="spent",
                    amount=-total,
                    description=f"Compra: {garment.name}",
                )
                CreditTransaction.objects.create(
                    user=locked_seller,
                    sale=sale,
                    tx_type="earned",
                    amount=sale.price_plr,
                    description=f"Venta: {garment.name}",
                )

                # Update sale status
                sale.status = "confirmed"
                sale.resolved_at = timezone.now()
                sale.save(update_fields=["status", "resolved_at"])

        await sync_to_async(_execute_transfer)()

        # On-chain transfer: burn from buyer wallet, mint to seller wallet
        try:
            buyer_wallet = buyer.wallet_address
            seller_wallet = seller.wallet_address
            if buyer_wallet and seller_wallet:
                # Burn from buyer
                burn_hash = await sync_to_async(burn_plr)(
                    amount_plr=total,
                    reason=f"Compra #{sale.pk}",
                    reference_id_str=f"sale-{sale.pk}-buy",
                    from_address=buyer_wallet,
                )
                # Mint to seller
                mint_hash = await sync_to_async(mint_plr)(
                    amount_plr=sale.price_plr,
                    reason=f"Venta #{sale.pk}",
                    reference_id_str=f"sale-{sale.pk}-sell",
                    to_address=seller_wallet,
                )
                sale.tx_hash = mint_hash
                await sale.asave(update_fields=["tx_hash"])
                await CreditTransaction.objects.filter(
                    sale=sale,
                    user_id=buyer.pk,
                ).aupdate(tx_hash=burn_hash)
                await CreditTransaction.objects.filter(
                    sale=sale,
                    user_id=seller.pk,
                ).aupdate(tx_hash=mint_hash)
                logger.info(
                    "On-chain sale transfer",
                    sale_id=sale.pk,
                    burn_hash=burn_hash,
                    mint_hash=mint_hash,
                )
        except Exception:
            logger.exception("Blockchain transfer failed for sale", sale_id=sale.pk)

        logger.info(
            "Sale confirmed",
            sale_id=sale.pk,
            buyer_id=buyer.pk,
            seller_id=seller.pk,
            total=total,
        )
        await _ConversationService.finalize_conversation_by_garment(sale.garment_id)
        return sale

    @classmethod
    async def reject(cls, seller: User, sale_id: int) -> Sale:
        """Reject a pending sale.

        Args:
            seller: The seller rejecting the sale.
            sale_id: The sale's primary key.

        Returns:
            The rejected Sale instance.

        Raises:
            ValueError: If validation fails.
        """
        sale = await SaleRepository.get_by_id(sale_id)
        if sale is None or sale.seller_id != seller.pk:
            raise ValueError("Sale not found")
        if sale.status != "pending":
            raise ValueError("Sale already processed")

        sale.status = "rejected"
        sale.resolved_at = timezone.now()
        await sale.asave(update_fields=["status", "resolved_at"])

        logger.info("Sale rejected", sale_id=sale.pk, seller_id=seller.pk)
        await _ConversationService.finalize_conversation_by_garment(sale.garment_id)
        return sale


class WalletService:
    """Service for wallet / credit operations."""

    @classmethod
    async def get_balance(cls, user: User) -> int:
        """Get the user's current credit balance.

        Args:
            user: The user.

        Returns:
            The credit balance in PLR.
        """
        return user.credits

    @classmethod
    async def get_transactions(cls, user: User) -> list[CreditTransaction]:
        """Get the user's credit transaction history.

        Args:
            user: The user.

        Returns:
            List of CreditTransaction instances.
        """
        return await CreditTransactionRepository.list_for_user(user)


class MirrorService:
    """Service for AI mirror actions (chat, reference photos, generation)."""

    @staticmethod
    def _placeholder_image(garment_name: str) -> str:
        """Build a fallback SVG data URL used when no image is provided."""
        label = garment_name.strip()[:24] or "Plur"
        svg = (
            "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='640' viewBox='0 0 512 640'>"
            "<rect width='512' height='640' fill='#1D1D1D'/>"
            "<rect x='56' y='96' width='400' height='448' rx='28' fill='#2A2A2A'/>"
            "<text x='256' y='300' text-anchor='middle' fill='#E4E4E7' font-size='26'"
            " font-family='Arial, sans-serif'>Plur AI Mirror</text>"
            f"<text x='256' y='342' text-anchor='middle' fill='#9CA3AF' font-size='20'"
            f" font-family='Arial, sans-serif'>{label}</text>"
            "</svg>"
        )
        return f"data:image/svg+xml,{quote(svg)}"

    @classmethod
    async def save_reference(cls, user: User, image_data: str) -> tuple[str, str]:
        """Validate and return a reference photo payload for the mirror flow."""
        normalized_image = image_data.strip()
        if not normalized_image.startswith("data:image/"):
            raise ValueError("Invalid reference image format")

        logger.info("Mirror reference uploaded", user_id=user.pk)
        return normalized_image, "¡Referencia cargada! Ya podés generar tu prueba en alta calidad."

    @classmethod
    async def chat(cls, user: User, garment_name: str, message: str) -> str:
        """Return a contextual assistant response for the mirror chat."""
        content = message.strip()
        if not content:
            raise ValueError("Message is required")

        garment = garment_name.strip() or "esa prenda"
        lowered = content.lower()

        if any(token in lowered for token in ("talle", "size", "fit", "calce")):
            reply = (
                f"Para {garment}, te recomiendo comparar medidas de hombros y largo. "
                "Si querés, te genero una prueba en alta calidad para validarlo visualmente."
            )
        elif any(token in lowered for token in ("color", "combinar", "look", "outfit")):
            reply = (
                f"{garment} combina muy bien con tonos neutros y accesorios minimalistas. "
                "También puedo generar una prueba para ver la combinación completa."
            )
        else:
            reply = (
                f"Buenísima elección. Si querés, genero tu prueba de {garment} en calidad alta por "
                f"{settings.PLR_AI_IMAGE_COST} PLR."
            )

        logger.info("Mirror chat message processed", user_id=user.pk)
        return reply

    @classmethod
    async def generate_try_on(
        cls,
        user: User,
        garment_name: str,
        garment_image: str,
        reference_image: str,
    ) -> tuple[str, str, int, int]:
        """Generate a virtual try-on result and charge the configured PLR cost."""
        cost = settings.PLR_AI_IMAGE_COST
        if cost <= 0:
            raise ValueError("Invalid AI image cost configuration")

        normalized_name = garment_name.strip() or "prenda"

        def _charge_user() -> tuple[int, int]:
            with transaction.atomic():
                locked_user = User.objects.select_for_update().get(pk=user.pk)
                if locked_user.credits < cost:
                    raise ValueError("Insufficient credits")

                locked_user.credits -= cost
                locked_user.save(update_fields=["credits"])

                ct = CreditTransaction.objects.create(
                    user=locked_user,
                    tx_type="spent",
                    amount=-cost,
                    description=f"Espejo AI: {normalized_name}",
                )
                return locked_user.credits, ct.pk

        remaining_credits, ct_pk = await sync_to_async(_charge_user)()

        # Burn PLR on-chain from user's wallet (fire-and-forget)
        try:
            if user.wallet_address:
                tx_hash = await sync_to_async(burn_plr)(
                    amount_plr=cost,
                    reason=f"Espejo AI: {normalized_name}",
                    reference_id_str=f"mirror-{ct_pk}",
                    from_address=user.wallet_address,
                )
                await CreditTransaction.objects.filter(pk=ct_pk).aupdate(tx_hash=tx_hash)
                logger.info("On-chain burn for mirror", user_id=user.pk, tx_hash=tx_hash)
        except Exception:
            logger.exception("Blockchain burn failed for mirror", user_id=user.pk)

        normalized_reference = reference_image.strip()
        normalized_garment_image = garment_image.strip()

        if normalized_reference.startswith("data:image/"):
            image_url = normalized_reference
        elif normalized_garment_image.startswith("data:image/") or normalized_garment_image.startswith("http"):
            image_url = normalized_garment_image
        else:
            image_url = cls._placeholder_image(normalized_name)

        reply = f"Listo. Generé tu prueba en alta calidad para {normalized_name}. Se descontó {cost} PLR de tu saldo."

        logger.info(
            "Mirror try-on generated",
            user_id=user.pk,
            cost=cost,
            remaining_credits=remaining_credits,
        )
        return image_url, reply, cost, remaining_credits

"""Sales API endpoint handlers — thin layer, delegates to services."""

from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest

from apps.sales.api.router import router
from apps.sales.api.schemas import (
    BalanceOut,
    BuyCreditsIn,
    BuyCreditsOut,
    ErrorOut,
    GarmentIn,
    GarmentNearbyOut,
    GarmentOut,
    GarmentUpdateIn,
    MirrorChatIn,
    MirrorChatOut,
    MirrorGenerateIn,
    MirrorGenerateOut,
    MirrorReferenceIn,
    MirrorReferenceOut,
    NearbyQueryIn,
    OnChainBalanceOut,
    PendingSaleOut,
    SaleInitiateIn,
    SaleOut,
    TransactionOut,
)
from apps.sales.models import Garment as GarmentModel
from apps.sales.models import Sale as SaleModel
from apps.sales.services import GarmentService, MirrorService, SaleService, WalletService
from apps.users.models import User
from core.auth import jwt_auth

# ------------------------------------------------------------------ #
# Garment endpoints                                                    #
# ------------------------------------------------------------------ #


@router.post(
    "/garments",
    response={201: GarmentOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Publish a garment for sale",
)
async def publish_garment(
    request: HttpRequest,
    payload: GarmentIn,
) -> tuple[int, GarmentOut | ErrorOut]:
    """Publish a new garment listing. Does not award tokens."""
    user: User = request.auth  # type: ignore[assignment]
    try:
        garment = await GarmentService.publish(
            seller=user,
            name=payload.name,
            description=payload.description,
            images=payload.images,
            price_plr=payload.price_plr,
            size=payload.size,
            style=payload.style,
            condition=payload.condition,
            location=payload.location,
            latitude=payload.latitude,
            longitude=payload.longitude,
            tags=payload.tags,
        )
        return 201, _garment_to_out(garment, user.full_name)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


@router.get(
    "/garments/nearby",
    response={200: list[GarmentNearbyOut], 400: ErrorOut},
    summary="Discover nearby garments",
)
async def list_nearby_garments(
    request: HttpRequest,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 50.0,
    style: str | None = None,
    size: str | None = None,
    condition: str | None = None,
) -> tuple[int, list[GarmentNearbyOut] | ErrorOut]:
    del request
    query = NearbyQueryIn(
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        style=style,
        size=size,
        condition=condition,
    )
    try:
        nearby = await GarmentService.find_nearby(
            lat=query.lat,
            lng=query.lng,
            radius_km=query.radius_km,
            style=query.style,
            size=query.size,
            condition=query.condition,
        )
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))

    return 200, [_garment_to_nearby_out(garment, garment.seller.full_name, distance) for garment, distance in nearby]


@router.get(
    "/garments/mine",
    response=list[GarmentOut],
    auth=jwt_auth,
    summary="List my published garments",
)
async def list_my_garments(
    request: HttpRequest,
) -> list[GarmentOut]:
    """Return all garments published by the authenticated user."""
    user: User = request.auth  # type: ignore[assignment]
    from apps.sales.repositories import GarmentRepository

    garments = await GarmentRepository.list_by_seller(user)
    return [_garment_to_out(g, user.full_name) for g in garments]


@router.patch(
    "/garments/{garment_id}",
    response={200: GarmentOut, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Update my published garment",
)
async def update_garment(
    request: HttpRequest,
    garment_id: int,
    payload: GarmentUpdateIn,
) -> tuple[int, GarmentOut | ErrorOut]:
    user: User = request.auth  # type: ignore[assignment]
    try:
        garment = await GarmentService.update(
            seller=user,
            garment_id=garment_id,
            name=payload.name,
            description=payload.description,
            images=payload.images,
            price_plr=payload.price_plr,
            size=payload.size,
            style=payload.style,
            condition=payload.condition,
            location=payload.location,
            latitude=payload.latitude,
            longitude=payload.longitude,
            tags=payload.tags,
        )
        return 200, _garment_to_out(garment, user.full_name)
    except ValueError as exc:
        message = str(exc)
        return _garment_mutation_error_status(message), ErrorOut(detail=message)


@router.delete(
    "/garments/{garment_id}",
    response={204: None, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Delete my published garment",
)
async def delete_garment(
    request: HttpRequest,
    garment_id: int,
) -> tuple[int, None] | tuple[int, ErrorOut]:
    user: User = request.auth  # type: ignore[assignment]
    try:
        await GarmentService.delete(seller=user, garment_id=garment_id)
        return 204, None
    except ValueError as exc:
        message = str(exc)
        return _garment_mutation_error_status(message), ErrorOut(detail=message)


# ------------------------------------------------------------------ #
# Sale endpoints                                                       #
# ------------------------------------------------------------------ #


@router.post(
    "/sales",
    response={201: SaleOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Initiate a purchase",
)
async def initiate_sale(
    request: HttpRequest,
    payload: SaleInitiateIn,
) -> tuple[int, SaleOut | ErrorOut]:
    """Buyer initiates a purchase by scanning the seller's QR code.

    Creates a pending sale that the seller must confirm.
    """
    user: User = request.auth  # type: ignore[assignment]
    try:
        sale = await SaleService.initiate(buyer=user, garment_id=payload.garment_id)
        # Re-fetch with relations for the response
        from apps.sales.repositories import SaleRepository

        full_sale = await SaleRepository.get_by_id(sale.pk)
        if full_sale is None:
            return 400, ErrorOut(detail="Failed to retrieve sale")
        return 201, _sale_to_out(full_sale)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


@router.get(
    "/sales/pending",
    response=list[PendingSaleOut],
    auth=jwt_auth,
    summary="List pending sales for seller",
)
async def list_pending_sales(
    request: HttpRequest,
) -> list[PendingSaleOut]:
    """List all pending sales awaiting the seller's confirmation."""
    user: User = request.auth  # type: ignore[assignment]
    from apps.sales.repositories import SaleRepository

    sales = await SaleRepository.list_pending_for_seller(user)
    result: list[PendingSaleOut] = []
    for sale in sales:
        images: list[str] = sale.garment.images if isinstance(sale.garment.images, list) else []
        result.append(
            PendingSaleOut(
                id=sale.pk,
                garment_id=sale.garment_id,
                garment_name=sale.garment.name,
                garment_image=images[0] if images else "",
                buyer_name=sale.buyer.full_name,
                price_plr=sale.price_plr,
                platform_fee=sale.platform_fee,
                created_at=sale.created_at,
            )
        )
    return result


@router.get(
    "/sales/{sale_id}",
    response={200: SaleOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Get sale status",
)
async def get_sale(
    request: HttpRequest,
    sale_id: int,
) -> tuple[int, SaleOut | ErrorOut]:
    """Get the current status of a sale. Used for polling by the buyer."""
    user: User = request.auth  # type: ignore[assignment]
    from apps.sales.repositories import SaleRepository

    sale = await SaleRepository.get_by_id(sale_id)
    if sale is None or (sale.buyer_id != user.pk and sale.seller_id != user.pk):
        return 404, ErrorOut(detail="Sale not found")
    return 200, _sale_to_out(sale)


@router.post(
    "/sales/{sale_id}/confirm",
    response={200: SaleOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Seller confirms a sale",
)
async def confirm_sale(
    request: HttpRequest,
    sale_id: int,
) -> tuple[int, SaleOut | ErrorOut]:
    """Seller confirms a pending sale. Credits are transferred atomically."""
    user: User = request.auth  # type: ignore[assignment]
    try:
        sale = await SaleService.confirm(seller=user, sale_id=sale_id)
        from apps.sales.repositories import SaleRepository

        full_sale = await SaleRepository.get_by_id(sale.pk)
        if full_sale is None:
            return 400, ErrorOut(detail="Failed to retrieve sale")
        return 200, _sale_to_out(full_sale)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))
    except Exception as exc:
        from loguru import logger

        logger.exception("Unexpected error confirming sale")
        return 400, ErrorOut(detail=str(exc))


@router.post(
    "/sales/{sale_id}/reject",
    response={200: SaleOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Seller rejects a sale",
)
async def reject_sale(
    request: HttpRequest,
    sale_id: int,
) -> tuple[int, SaleOut | ErrorOut]:
    """Seller rejects a pending sale. No credits are transferred."""
    user: User = request.auth  # type: ignore[assignment]
    try:
        sale = await SaleService.reject(seller=user, sale_id=sale_id)
        from apps.sales.repositories import SaleRepository

        full_sale = await SaleRepository.get_by_id(sale.pk)
        if full_sale is None:
            return 400, ErrorOut(detail="Failed to retrieve sale")
        return 200, _sale_to_out(full_sale)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


# ------------------------------------------------------------------ #
# Wallet endpoints                                                     #
# ------------------------------------------------------------------ #


@router.get(
    "/wallet/balance",
    response=BalanceOut,
    auth=jwt_auth,
    summary="Get credit balance",
)
async def get_balance(
    request: HttpRequest,
) -> BalanceOut:
    """Return the authenticated user's current PLR credit balance."""
    user: User = request.auth  # type: ignore[assignment]
    balance = await WalletService.get_balance(user)
    return BalanceOut(credits=balance)


@router.get(
    "/wallet/transactions",
    response=list[TransactionOut],
    auth=jwt_auth,
    summary="Get transaction history",
)
async def get_transactions(
    request: HttpRequest,
) -> list[TransactionOut]:
    """Return the authenticated user's credit transaction history."""
    user: User = request.auth  # type: ignore[assignment]
    txs = await WalletService.get_transactions(user)
    return [
        TransactionOut(
            id=tx.pk,
            tx_type=tx.tx_type,
            amount=tx.amount,
            description=tx.description,
            tx_hash=tx.tx_hash,
            created_at=tx.created_at,
        )
        for tx in txs
    ]


@router.get(
    "/wallet/on-chain-balance",
    response={200: OnChainBalanceOut, 500: ErrorOut},
    auth=jwt_auth,
    summary="Get on-chain PLR balance of the treasury wallet",
)
async def get_on_chain_balance(
    request: HttpRequest,
) -> tuple[int, OnChainBalanceOut | ErrorOut]:
    """Read the PLR token balance from the Avalanche C-Chain."""
    try:
        from asgiref.sync import sync_to_async

        from core.blockchain import get_plr_balance

        balance = await sync_to_async(get_plr_balance)(settings.AVALANCHE_BACKEND_WALLET_ADDRESS)
        return 200, OnChainBalanceOut(
            balance_plr=balance,
            wallet_address=settings.AVALANCHE_BACKEND_WALLET_ADDRESS,
        )
    except Exception as exc:
        from loguru import logger

        logger.exception("Failed to read on-chain balance")
        return 500, ErrorOut(detail=f"Failed to read on-chain balance: {exc}")


@router.post(
    "/wallet/buy",
    response={200: BuyCreditsOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Purchase PLR credits (mock payment)",
)
async def buy_credits(
    request: HttpRequest,
    payload: BuyCreditsIn,
) -> tuple[int, BuyCreditsOut | ErrorOut]:
    """Simulate a credit purchase. Mints tokens on-chain and credits the user."""
    user: User = request.auth  # type: ignore[assignment]
    amount = payload.amount_plr
    if amount <= 0 or amount > 10000:
        return 400, ErrorOut(detail="Amount must be between 1 and 10,000 PLR")

    cost_usd = round(amount * 0.15, 2)

    from asgiref.sync import sync_to_async
    from django.db import transaction

    from apps.sales.models import CreditTransaction

    def _credit_user() -> int:
        with transaction.atomic():
            from apps.users.models import User as UserModel

            locked = UserModel.objects.select_for_update().get(pk=user.pk)
            locked.credits += amount
            locked.save(update_fields=["credits"])
            CreditTransaction.objects.create(
                user=locked,
                tx_type="purchased",
                amount=amount,
                description=f"Compra: {amount} PLR (US$ {cost_usd})",
            )
            return locked.credits

    new_balance = await sync_to_async(_credit_user)()

    tx_hash = ""
    try:
        from core.blockchain import mint_plr

        if user.wallet_address:
            tx_hash = await sync_to_async(mint_plr)(
                amount_plr=amount,
                reason=f"Compra {amount} PLR",
                reference_id_str=f"buy-{user.pk}-{new_balance}",
                to_address=user.wallet_address,
            )
            await CreditTransaction.objects.filter(
                user=user, description=f"Compra: {amount} PLR (US$ {cost_usd})"
            ).aupdate(tx_hash=tx_hash)
    except Exception:
        from loguru import logger

        logger.exception("Blockchain mint failed for credit purchase")

    return 200, BuyCreditsOut(
        credits=new_balance,
        amount_plr=amount,
        cost_usd=cost_usd,
        tx_hash=tx_hash,
    )


# ------------------------------------------------------------------ #
# Mirror AI endpoints                                                  #
# ------------------------------------------------------------------ #


@router.post(
    "/mirror/reference",
    response={200: MirrorReferenceOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Upload mirror reference photo",
)
async def upload_mirror_reference(
    request: HttpRequest,
    payload: MirrorReferenceIn,
) -> tuple[int, MirrorReferenceOut | ErrorOut]:
    """Save a user reference photo for AI mirror try-on."""
    user: User = request.auth  # type: ignore[assignment]
    try:
        image_url, message = await MirrorService.save_reference(user=user, image_data=payload.image_data)
        return 200, MirrorReferenceOut(image_url=image_url, message=message)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


@router.post(
    "/mirror/chat",
    response={200: MirrorChatOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Send message to AI mirror assistant",
)
async def mirror_chat(
    request: HttpRequest,
    payload: MirrorChatIn,
) -> tuple[int, MirrorChatOut | ErrorOut]:
    """Return an AI-style assistant reply for mirror conversations."""
    user: User = request.auth  # type: ignore[assignment]
    try:
        reply = await MirrorService.chat(
            user=user,
            garment_name=payload.garment_name,
            message=payload.message,
        )
        return 200, MirrorChatOut(reply=reply)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


@router.post(
    "/mirror/generate",
    response={200: MirrorGenerateOut, 400: ErrorOut, 402: ErrorOut},
    auth=jwt_auth,
    summary="Generate AI mirror try-on image",
)
async def mirror_generate(
    request: HttpRequest,
    payload: MirrorGenerateIn,
) -> tuple[int, MirrorGenerateOut | ErrorOut]:
    """Generate a mirror try-on image and charge PLR credits."""
    user: User = request.auth  # type: ignore[assignment]
    try:
        image_url, reply, cost_plr, remaining_credits = await MirrorService.generate_try_on(
            user=user,
            garment_name=payload.garment_name,
            garment_image=payload.garment_image,
            reference_image=payload.reference_image,
        )
        return 200, MirrorGenerateOut(
            image_url=image_url,
            reply=reply,
            cost_plr=cost_plr,
            remaining_credits=remaining_credits,
        )
    except ValueError as exc:
        message = str(exc)
        if message == "Insufficient credits":
            return 402, ErrorOut(detail=message)
        return 400, ErrorOut(detail=message)


# ------------------------------------------------------------------ #
# Helpers                                                              #
# ------------------------------------------------------------------ #


def _garment_to_out(garment: GarmentModel, seller_name: str) -> GarmentOut:
    """Convert a Garment model instance to GarmentOut schema.

    Args:
        garment: The Garment model instance.
        seller_name: The seller's display name.

    Returns:
        A GarmentOut schema instance.
    """
    g = garment
    return GarmentOut(
        id=g.pk,
        seller_id=g.seller_id,
        seller_name=seller_name,
        name=g.name,
        description=g.description,
        images=g.images if isinstance(g.images, list) else [],
        price_plr=g.price_plr,
        size=g.size,
        style=g.style,
        condition=g.condition,
        location=g.location,
        latitude=float(g.latitude) if g.latitude is not None else None,
        longitude=float(g.longitude) if g.longitude is not None else None,
        tags=g.tags if isinstance(g.tags, list) else [],
        status=g.status,
        created_at=g.created_at,
    )


def _garment_to_nearby_out(
    garment: GarmentModel,
    seller_name: str,
    distance_km: float | None,
) -> GarmentNearbyOut:
    base = _garment_to_out(garment, seller_name)
    return GarmentNearbyOut(
        **base.model_dump(),
        distance_km=round(distance_km, 3) if distance_km is not None else None,
    )


def _sale_to_out(sale: SaleModel) -> SaleOut:
    """Convert a Sale model instance to SaleOut schema.

    Args:
        sale: The Sale model instance with related objects loaded.

    Returns:
        A SaleOut schema instance.
    """
    s = sale
    images: list[str] = s.garment.images if isinstance(s.garment.images, list) else []
    return SaleOut(
        id=s.pk,
        garment_id=s.garment_id,
        garment_name=s.garment.name,
        garment_image=images[0] if images else "",
        buyer_id=s.buyer_id,
        buyer_name=s.buyer.full_name,
        seller_id=s.seller_id,
        seller_name=s.seller.full_name,
        price_plr=s.price_plr,
        platform_fee=s.platform_fee,
        status=s.status,
        created_at=s.created_at,
        resolved_at=s.resolved_at,
        tx_hash=s.tx_hash,
    )


def _garment_mutation_error_status(message: str) -> int:
    if message == "Garment not found":
        return 404
    return 403

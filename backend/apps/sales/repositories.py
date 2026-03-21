"""Database access layer for the sales app."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from apps.sales.models import CreditTransaction, Garment, Sale

if TYPE_CHECKING:
    from apps.users.models import User


class GarmentRepository:
    """Repository for Garment database operations."""

    @staticmethod
    async def create(
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
        """Create and persist a new garment listing.

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
        """
        garment = Garment(
            seller=seller,
            name=name,
            description=description,
            images=images,
            price_plr=price_plr,
            size=size,
            style=style,
            condition=condition,
            location=location,
            latitude=latitude,
            longitude=longitude,
            tags=tags,
        )
        await garment.asave()
        return garment

    @staticmethod
    async def find_nearby(
        lat: float | None,
        lng: float | None,
        radius_km: float,
        style: str | None = None,
        size: str | None = None,
        condition: str | None = None,
    ) -> list[tuple[Garment, float | None]]:
        queryset = Garment.objects.filter(status="active").select_related("seller")

        if style:
            queryset = queryset.filter(style=style)
        if size:
            queryset = queryset.filter(size=size)
        if condition:
            queryset = queryset.filter(condition=condition)

        garments = [garment async for garment in queryset.order_by("-created_at", "-pk")]

        if lat is None or lng is None:
            return [(garment, None) for garment in garments]

        nearby: list[tuple[Garment, float | None]] = []
        for garment in garments:
            if garment.latitude is None or garment.longitude is None:
                continue

            distance = _haversine_km(lat, lng, float(garment.latitude), float(garment.longitude))
            if distance <= radius_km:
                nearby.append((garment, distance))

        nearby.sort(key=lambda item: item[1] if item[1] is not None else float("inf"))
        return nearby

    @staticmethod
    async def get_by_id(garment_id: int) -> Garment | None:
        """Get a garment by its primary key.

        Args:
            garment_id: The garment's primary key.

        Returns:
            The Garment instance or None if not found.
        """
        try:
            return await Garment.objects.select_related("seller").aget(pk=garment_id)
        except Garment.DoesNotExist:
            return None

    @staticmethod
    async def list_by_seller(seller: User) -> list[Garment]:
        """List all garments published by a seller.

        Args:
            seller: The seller user.

        Returns:
            List of Garment instances ordered by creation date.
        """
        return [g async for g in Garment.objects.filter(seller=seller).order_by("-created_at")]

    @staticmethod
    async def soft_delete(garment: Garment) -> None:
        garment.status = "sold"
        await garment.asave(update_fields=["status"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class SaleRepository:
    """Repository for Sale database operations."""

    @staticmethod
    async def create(
        garment: Garment,
        buyer: User,
        seller: User,
        price_plr: int,
        platform_fee: int,
    ) -> Sale:
        """Create a new pending sale.

        Args:
            garment: The garment being sold.
            buyer: The buyer user.
            seller: The seller user.
            price_plr: Sale price in PLR.
            platform_fee: Platform fee in PLR.

        Returns:
            The newly created Sale instance.
        """
        sale = Sale(
            garment=garment,
            buyer=buyer,
            seller=seller,
            price_plr=price_plr,
            platform_fee=platform_fee,
        )
        await sale.asave()
        return sale

    @staticmethod
    async def get_by_id(sale_id: int) -> Sale | None:
        """Get a sale by its primary key with related objects.

        Args:
            sale_id: The sale's primary key.

        Returns:
            The Sale instance or None if not found.
        """
        try:
            return await Sale.objects.select_related("garment", "buyer", "seller").aget(pk=sale_id)
        except Sale.DoesNotExist:
            return None

    @staticmethod
    async def has_pending_sale(garment_id: int) -> bool:
        """Check if a garment already has a pending sale.

        Args:
            garment_id: The garment's primary key.

        Returns:
            True if a pending sale exists.
        """
        return await Sale.objects.filter(garment_id=garment_id, status="pending").aexists()

    @staticmethod
    async def list_pending_for_seller(seller: User) -> list[Sale]:
        """List all pending sales for a seller.

        Args:
            seller: The seller user.

        Returns:
            List of pending Sale instances with related objects.
        """
        return [
            s
            async for s in Sale.objects.filter(seller=seller, status="pending")
            .select_related("garment", "buyer")
            .order_by("-created_at")
        ]


class CreditTransactionRepository:
    """Repository for CreditTransaction database operations."""

    @staticmethod
    async def create_for_user(
        user: User,
        tx_type: str,
        amount: int,
        description: str,
        sale: Sale | None = None,
    ) -> CreditTransaction:
        """Create a single credit transaction.

        Args:
            user: The user this transaction belongs to.
            tx_type: Transaction type (earned, spent, purchased).
            amount: Amount in PLR (positive for income, negative for expense).
            description: Human-readable description.
            sale: Optional related sale.

        Returns:
            The newly created CreditTransaction instance.
        """
        tx = CreditTransaction(
            user=user,
            sale=sale,
            tx_type=tx_type,
            amount=amount,
            description=description,
        )
        await tx.asave()
        return tx

    @staticmethod
    async def list_for_user(user: User) -> list[CreditTransaction]:
        """List all credit transactions for a user.

        Args:
            user: The user whose transactions to list.

        Returns:
            List of CreditTransaction instances ordered by creation date.
        """
        return [tx async for tx in CreditTransaction.objects.filter(user=user).order_by("-created_at")]

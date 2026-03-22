"""Pydantic schemas for sales API input and output."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ninja import Schema
from pydantic import Field

if TYPE_CHECKING:
    from datetime import datetime

# ------------------------------------------------------------------ #
# Shared                                                               #
# ------------------------------------------------------------------ #


class ErrorOut(Schema):
    """Generic error response schema."""

    detail: str


# ------------------------------------------------------------------ #
# Garment schemas                                                      #
# ------------------------------------------------------------------ #


class GarmentIn(Schema):
    """Input schema for publishing a garment."""

    name: str
    description: str = ""
    images: list[str] = Field(default_factory=list)
    price_plr: int
    size: str = ""
    style: str = ""
    condition: str = ""
    location: str = ""
    latitude: float | None = None
    longitude: float | None = None
    tags: list[str] = Field(default_factory=list)


class GarmentUpdateIn(Schema):
    """Input schema for partially updating a garment."""

    name: str | None = None
    description: str | None = None
    images: list[str] | None = None
    price_plr: int | None = None
    size: str | None = None
    style: str | None = None
    condition: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    tags: list[str] | None = None


class GarmentOut(Schema):
    """Output schema for a garment."""

    id: int
    seller_id: int
    seller_name: str
    name: str
    description: str
    images: list[str]
    price_plr: int
    size: str
    style: str
    condition: str
    location: str
    latitude: float | None
    longitude: float | None
    tags: list[str]
    status: str
    created_at: datetime


class NearbyQueryIn(Schema):
    lat: float | None = None
    lng: float | None = None
    radius_km: float = 50.0
    style: str | None = None
    size: str | None = None
    condition: str | None = None


class GarmentNearbyOut(GarmentOut):
    distance_km: float | None = None


# ------------------------------------------------------------------ #
# Sale schemas                                                         #
# ------------------------------------------------------------------ #


class SaleInitiateIn(Schema):
    """Input schema for initiating a sale."""

    garment_id: int


class SaleOut(Schema):
    """Output schema for a sale."""

    id: int
    garment_id: int
    garment_name: str
    garment_image: str
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    price_plr: int
    platform_fee: int
    status: str
    created_at: datetime
    resolved_at: datetime | None
    tx_hash: str = ""


class PendingSaleOut(Schema):
    """Output schema for a pending sale (seller's view)."""

    id: int
    garment_id: int
    garment_name: str
    garment_image: str
    buyer_name: str
    price_plr: int
    platform_fee: int
    created_at: datetime


# ------------------------------------------------------------------ #
# Wallet schemas                                                       #
# ------------------------------------------------------------------ #


class BalanceOut(Schema):
    """Output schema for the user's credit balance."""

    credits: int


class TransactionOut(Schema):
    """Output schema for a credit transaction."""

    id: int
    tx_type: str
    amount: int
    description: str
    tx_hash: str = ""
    created_at: datetime


class OnChainBalanceOut(Schema):
    """Output schema for on-chain PLR balance."""

    balance_plr: int
    wallet_address: str


class MirrorReferenceIn(Schema):
    """Input schema for uploading a mirror reference photo."""

    image_data: str


class MirrorReferenceOut(Schema):
    """Output schema for reference photo upload."""

    image_url: str
    message: str


class MirrorChatIn(Schema):
    """Input schema for mirror chat messages."""

    garment_name: str
    message: str


class MirrorChatOut(Schema):
    """Output schema for mirror chat assistant reply."""

    reply: str


class MirrorGenerateIn(Schema):
    """Input schema for generating a try-on image."""

    garment_name: str
    garment_image: str = ""
    reference_image: str = ""


class MirrorGenerateOut(Schema):
    """Output schema for generated try-on image."""

    image_url: str
    reply: str
    cost_plr: int
    remaining_credits: int


def _rebuild_datetime_schemas() -> None:
    from datetime import datetime

    for schema in (GarmentOut, GarmentNearbyOut, SaleOut, PendingSaleOut, TransactionOut):
        schema.model_rebuild(_types_namespace={"datetime": datetime})


_rebuild_datetime_schemas()

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ninja import Schema

if TYPE_CHECKING:
    from decimal import Decimal


class ErrorOut(Schema):
    detail: str


class CreateOrderIn(Schema):
    amount_fiat: Decimal
    currency_fiat: str
    amount_plr: Decimal


class CreateOrderOut(Schema):
    order_id: int
    status: str
    transak_session_data: dict[str, Any]


class WebhookEventIn(Schema):
    event_id: str
    event_type: str
    order_id: str


class WebhookAckOut(Schema):
    received: bool


def _rebuild_decimal_schemas() -> None:
    from decimal import Decimal

    for schema in (CreateOrderIn,):
        schema.model_rebuild(_types_namespace={"Decimal": Decimal})


_rebuild_decimal_schemas()


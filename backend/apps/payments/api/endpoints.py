from __future__ import annotations

from typing import TYPE_CHECKING

from ninja import Header

from apps.payments.api.router import router
from apps.payments.api.schemas import CreateOrderIn, CreateOrderOut, ErrorOut, WebhookAckOut, WebhookEventIn
from apps.payments.services import PurchaseOrderService, WebhookService
from core.auth import jwt_auth

if TYPE_CHECKING:
    from django.http import HttpRequest

    from apps.users.models import User


@router.post(
    "/orders/",
    response={201: CreateOrderOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Create Transak purchase order",
)
async def create_order(
    request: HttpRequest,
    payload: CreateOrderIn,
) -> tuple[int, CreateOrderOut | ErrorOut]:
    user: User = request.auth  # type: ignore[assignment]
    try:
        order = await PurchaseOrderService.create_order(
            user=user,
            amount_fiat=payload.amount_fiat,
            currency_fiat=payload.currency_fiat,
            amount_plr=payload.amount_plr,
        )
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))

    return 201, CreateOrderOut(
        order_id=order.pk,
        status=order.status,
        transak_session_data=order.transak_session_data,
    )


@router.post(
    "/webhook/",
    response={200: WebhookAckOut, 401: ErrorOut},
    auth=None,
    summary="Transak webhook receiver",
)
async def transak_webhook(
    request: HttpRequest,
    payload: WebhookEventIn,
    x_signature: str = Header(alias="X-Signature", default=""),
) -> tuple[int, WebhookAckOut | ErrorOut]:
    raw_body = request.body
    try:
        await WebhookService.reconcile_webhook_event(
            event_id=payload.event_id,
            transak_order_id=payload.order_id,
            event_type=payload.event_type,
            provided_signature=x_signature,
            raw_body=raw_body,
        )
    except PermissionError as exc:
        return 401, ErrorOut(detail=str(exc))

    return 200, WebhookAckOut(received=True)

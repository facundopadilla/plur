from __future__ import annotations

from typing import TYPE_CHECKING

from apps.payments.api.router import router
from apps.payments.api.schemas import CreateOrderIn, CreateOrderOut, ErrorOut
from apps.payments.services import PurchaseOrderService
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

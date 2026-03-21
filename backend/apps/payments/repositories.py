from __future__ import annotations

from typing import TYPE_CHECKING, Any

from apps.payments.models import PurchaseOrder

if TYPE_CHECKING:
    from decimal import Decimal
    from uuid import UUID

    from apps.users.models import User


class PurchaseOrderRepository:
    @staticmethod
    async def create_pending(
        user: User,
        amount_fiat: Decimal,
        currency_fiat: str,
        amount_plr: Decimal,
    ) -> PurchaseOrder:
        order = PurchaseOrder(
            user=user,
            amount_fiat=amount_fiat,
            currency_fiat=currency_fiat,
            amount_plr=amount_plr,
            status=PurchaseOrder.STATUS_PENDING,
        )
        await order.asave()
        return order

    @staticmethod
    async def get_by_idempotency_key(idempotency_key: UUID) -> PurchaseOrder | None:
        try:
            return await PurchaseOrder.objects.aget(idempotency_key=idempotency_key)
        except PurchaseOrder.DoesNotExist:
            return None

    @staticmethod
    async def attach_transak_session(
        order: PurchaseOrder,
        transak_order_id: str,
        transak_session_data: dict[str, Any],
    ) -> PurchaseOrder:
        order.transak_order_id = transak_order_id
        order.transak_session_data = transak_session_data
        await order.asave(update_fields=["transak_order_id", "transak_session_data", "updated_at"])
        return order

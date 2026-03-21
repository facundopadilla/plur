from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from loguru import logger

from apps.payments.repositories import PurchaseOrderRepository

if TYPE_CHECKING:
    from decimal import Decimal

    from apps.payments.models import PurchaseOrder
    from apps.users.models import User


class PurchaseOrderService:
    @staticmethod
    async def create_order(
        user: User,
        amount_fiat: Decimal,
        currency_fiat: str,
        amount_plr: Decimal,
    ) -> PurchaseOrder:
        normalized_currency = currency_fiat.strip().upper()
        supported_currencies = {currency.upper() for currency in settings.TRANSAK_SUPPORTED_CURRENCIES}

        if normalized_currency not in supported_currencies:
            raise ValueError("Unsupported fiat currency")

        order = await PurchaseOrderRepository.create_pending(
            user=user,
            amount_fiat=amount_fiat,
            currency_fiat=normalized_currency,
            amount_plr=amount_plr,
        )
        session_data = _build_mock_transak_session(order_id=order.pk)

        await PurchaseOrderRepository.attach_transak_session(
            order=order,
            transak_order_id=session_data["transak_order_id"],
            transak_session_data=session_data,
        )

        logger.info(
            "Purchase order created",
            order_id=order.pk,
            user_id=user.pk,
            currency_fiat=normalized_currency,
            amount_fiat=str(amount_fiat),
            amount_plr=str(amount_plr),
        )
        return order


def _build_mock_transak_session(order_id: int | None) -> dict[str, Any]:
    normalized_order_id = order_id if order_id is not None else 0
    return {
        "checkout_url": "https://transak.com/mock",
        "transak_order_id": f"mock-{normalized_order_id}",
    }

from __future__ import annotations

import hashlib
import hmac
from typing import TYPE_CHECKING, Any

from asgiref.sync import sync_to_async
from django.conf import settings
from loguru import logger

from apps.payments.repositories import PurchaseOrderRepository, WebhookEventRepository

if TYPE_CHECKING:
    from decimal import Decimal

    from apps.payments.models import PurchaseOrder
    from apps.users.models import User

EVENT_ORDER_COMPLETED = "ORDER_COMPLETED"


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


class WebhookService:
    @staticmethod
    def verify_signature(raw_body: bytes, provided_signature: str) -> None:
        secret = settings.TRANSAK_WEBHOOK_SECRET
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, provided_signature):
            raise PermissionError("Invalid webhook signature")

    @staticmethod
    async def reconcile_webhook_event(
        event_id: str,
        transak_order_id: str,
        event_type: str,
        provided_signature: str,
        raw_body: bytes,
    ) -> bool:
        WebhookService.verify_signature(raw_body, provided_signature)

        existing = await WebhookEventRepository.get_by_event_id(event_id)
        if existing is not None:
            logger.info("Webhook event already processed (idempotent)", event_id=event_id)
            return False

        if event_type == EVENT_ORDER_COMPLETED:
            order = await PurchaseOrderRepository.get_by_transak_order_id(transak_order_id)
            if order is not None and order.status == order.STATUS_PENDING:
                await PurchaseOrderRepository.settle(order)
                await _credit_plr_for_order(order)
                logger.info(
                    "Order settled and PLR credited",
                    order_id=order.pk,
                    transak_order_id=transak_order_id,
                )

        await WebhookEventRepository.mark_processed(
            event_id=event_id,
            event_type=event_type,
            order_id=transak_order_id,
        )
        return True


async def _credit_plr_for_order(order: PurchaseOrder) -> None:
    from core.blockchain import mint_plr

    amount_plr_int = int(order.amount_plr)
    reference_id = f"purchase-order-{order.pk}"
    try:
        tx_hash = await sync_to_async(mint_plr)(
            amount_plr=amount_plr_int,
            reason="Transak purchase order settled",
            reference_id_str=reference_id,
        )
        logger.info("PLR minted for order", order_id=order.pk, tx_hash=tx_hash)
    except Exception:
        logger.exception("PLR mint failed for order", order_id=order.pk)


def _build_mock_transak_session(order_id: int | None) -> dict[str, Any]:
    normalized_order_id = order_id if order_id is not None else 0
    return {
        "checkout_url": "https://transak.com/mock",
        "transak_order_id": f"mock-{normalized_order_id}",
    }

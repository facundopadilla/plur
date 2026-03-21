from __future__ import annotations

from decimal import Decimal
import hashlib
import hmac
import json
from unittest.mock import AsyncMock, patch

from django.test import AsyncClient, override_settings
import pytest

from apps.payments.models import PurchaseOrder, WebhookEvent
from apps.users.models import User

WEBHOOK_SECRET = "test-webhook-secret"


@pytest.fixture
def async_client() -> AsyncClient:
    return AsyncClient()


async def _create_active_user(email: str) -> User:
    return await User.objects.acreate(
        email=email,
        first_name="Test",
        last_name="User",
        date_of_birth="1990-01-01",
        phone_number="+5491111111111",
        is_active=True,
    )


async def _create_pending_order(user: User, transak_order_id: str = "txn-abc123") -> PurchaseOrder:
    return await PurchaseOrder.objects.acreate(
        user=user,
        amount_fiat=Decimal("100.00"),
        currency_fiat="USD",
        amount_plr=Decimal("150.00000000"),
        status=PurchaseOrder.STATUS_PENDING,
        transak_order_id=transak_order_id,
    )


def _sign(body: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()


def _payload(event_id: str, event_type: str, order_id: str) -> dict:
    return {"event_id": event_id, "event_type": event_type, "order_id": order_id}


@pytest.mark.django_db(transaction=True)
@override_settings(TRANSAK_WEBHOOK_SECRET=WEBHOOK_SECRET)
async def test_webhook_invalid_signature_returns_401(async_client: AsyncClient) -> None:
    body = json.dumps(_payload("evt-001", "ORDER_COMPLETED", "txn-001")).encode()

    response = await async_client.post(
        "/api/payments/webhook/",
        data=body,
        content_type="application/json",
        headers={"X-Signature": "bad-signature"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid webhook signature"
    assert not await WebhookEvent.objects.filter(event_id="evt-001").aexists()


@pytest.mark.django_db(transaction=True)
@override_settings(TRANSAK_WEBHOOK_SECRET=WEBHOOK_SECRET)
async def test_webhook_order_completed_settles_order_once(async_client: AsyncClient) -> None:
    user = await _create_active_user("buyer-webhook@example.com")
    order = await _create_pending_order(user, transak_order_id="txn-settle-001")

    body = json.dumps(_payload("evt-settle-001", "ORDER_COMPLETED", "txn-settle-001")).encode()

    with patch("apps.payments.services._credit_plr_for_order", new_callable=AsyncMock) as mock_credit:
        response = await async_client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            headers={"X-Signature": _sign(body)},
        )

    assert response.status_code == 200
    assert response.json()["received"] is True

    await order.arefresh_from_db()
    assert order.status == PurchaseOrder.STATUS_SETTLED
    mock_credit.assert_awaited_once()
    assert await WebhookEvent.objects.filter(event_id="evt-settle-001").aexists()


@pytest.mark.django_db(transaction=True)
@override_settings(TRANSAK_WEBHOOK_SECRET=WEBHOOK_SECRET)
async def test_webhook_duplicate_event_deduplicates(async_client: AsyncClient) -> None:
    user = await _create_active_user("buyer-dedup@example.com")
    await _create_pending_order(user, transak_order_id="txn-dedup-001")

    body = json.dumps(_payload("evt-dedup-001", "ORDER_COMPLETED", "txn-dedup-001")).encode()
    sig = _sign(body)

    with patch("apps.payments.services._credit_plr_for_order", new_callable=AsyncMock) as mock_credit:
        r1 = await async_client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            headers={"X-Signature": sig},
        )
        r2 = await async_client.post(
            "/api/payments/webhook/",
            data=body,
            content_type="application/json",
            headers={"X-Signature": sig},
        )

    assert r1.status_code == 200
    assert r2.status_code == 200

    mock_credit.assert_awaited_once()
    assert await WebhookEvent.objects.filter(event_id="evt-dedup-001").acount() == 1

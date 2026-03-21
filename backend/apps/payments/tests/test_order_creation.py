from __future__ import annotations

from decimal import Decimal
import uuid

from django.db import IntegrityError
from django.test import AsyncClient
import pytest

from apps.payments.models import PurchaseOrder
from apps.users.models import User
from apps.users.services import AuthService


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


def _auth_headers(user: User) -> dict[str, str]:
    token = AuthService.create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_create_order_success(async_client: AsyncClient) -> None:
    user = await _create_active_user("buyer-success@example.com")

    response = await async_client.post(
        "/api/payments/orders/",
        data={
            "amount_fiat": "100.00",
            "currency_fiat": "USD",
            "amount_plr": "150.25000000",
        },
        content_type="application/json",
        headers=_auth_headers(user),
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "pending"
    assert payload["transak_session_data"]["checkout_url"] == "https://transak.com/mock"

    order = await PurchaseOrder.objects.aget(pk=payload["order_id"])
    assert order.user_id == user.pk
    assert order.amount_fiat == Decimal("100.00")
    assert order.currency_fiat == "USD"
    assert order.amount_plr == Decimal("150.25000000")
    assert order.transak_order_id == f"mock-{order.pk}"
    assert order.status == "pending"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_create_order_rejects_unsupported_currency(async_client: AsyncClient) -> None:
    user = await _create_active_user("buyer-unsupported@example.com")

    response = await async_client.post(
        "/api/payments/orders/",
        data={
            "amount_fiat": "50.00",
            "currency_fiat": "XYZ",
            "amount_plr": "75.00000000",
        },
        content_type="application/json",
        headers=_auth_headers(user),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported fiat currency"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_purchase_order_idempotency_key_is_unique() -> None:
    user = await _create_active_user("buyer-idempotency@example.com")
    key = uuid.uuid4()

    await PurchaseOrder.objects.acreate(
        user=user,
        amount_fiat=Decimal("25.00"),
        currency_fiat="USD",
        amount_plr=Decimal("30.00000000"),
        idempotency_key=key,
    )

    with pytest.raises(IntegrityError):
        await PurchaseOrder.objects.acreate(
            user=user,
            amount_fiat=Decimal("25.00"),
            currency_fiat="USD",
            amount_plr=Decimal("30.00000000"),
            idempotency_key=key,
        )

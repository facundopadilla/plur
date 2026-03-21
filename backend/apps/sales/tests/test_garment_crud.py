from __future__ import annotations

from django.test import AsyncClient
import pytest

from apps.sales.models import Garment
from apps.users.models import User
from apps.users.services import AuthService


@pytest.fixture
def async_client() -> AsyncClient:
    return AsyncClient()


async def _create_user(email: str) -> User:
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
async def test_owner_can_edit_garment(async_client: AsyncClient) -> None:
    seller = await _create_user("seller-edit@example.com")
    garment = await Garment.objects.acreate(
        seller=seller,
        name="Old Name",
        description="Old Description",
        images=["https://example.com/old.png"],
        price_plr=10,
        status="active",
    )

    response = await async_client.patch(
        f"/api/sales/garments/{garment.id}",
        data={"name": "New Name", "price_plr": 20},
        content_type="application/json",
        headers=_auth_headers(seller),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["price_plr"] == 20

    await garment.arefresh_from_db()
    assert garment.name == "New Name"
    assert garment.price_plr == 20


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_owner_can_delete_garment(async_client: AsyncClient) -> None:
    seller = await _create_user("seller-delete@example.com")
    garment = await Garment.objects.acreate(
        seller=seller,
        name="Delete Me",
        description="",
        images=[],
        price_plr=15,
        status="active",
    )

    response = await async_client.delete(
        f"/api/sales/garments/{garment.id}",
        headers=_auth_headers(seller),
    )

    assert response.status_code == 204
    await garment.arefresh_from_db()
    assert garment.status == "sold"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_non_owner_cannot_edit_garment(async_client: AsyncClient) -> None:
    seller = await _create_user("seller-non-owner@example.com")
    stranger = await _create_user("stranger-non-owner@example.com")
    garment = await Garment.objects.acreate(
        seller=seller,
        name="Seller Garment",
        description="",
        images=[],
        price_plr=25,
        status="active",
    )

    response = await async_client.patch(
        f"/api/sales/garments/{garment.id}",
        data={"name": "Hijacked Name"},
        content_type="application/json",
        headers=_auth_headers(stranger),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You can only modify your own garments"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_sold_garment_cannot_be_edited(async_client: AsyncClient) -> None:
    seller = await _create_user("seller-sold@example.com")
    garment = await Garment.objects.acreate(
        seller=seller,
        name="Already Sold",
        description="",
        images=[],
        price_plr=30,
        status="sold",
    )

    response = await async_client.patch(
        f"/api/sales/garments/{garment.id}",
        data={"description": "new description"},
        content_type="application/json",
        headers=_auth_headers(seller),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Sold garments cannot be modified"

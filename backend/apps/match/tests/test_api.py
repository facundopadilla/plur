from __future__ import annotations

from django.test import Client
import pytest

from apps.match.models import Conversation
from apps.sales.models import Garment
from apps.users.models import User
from apps.users.services import AuthService


@pytest.fixture
def api_client() -> Client:
    return Client()


def _auth_header_for(user_id: int) -> dict[str, str]:
    token = AuthService.create_access_token(user_id)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def _create_user(idx: int) -> User:
    return User.objects.create_user(
        email=f"user{idx}@example.com",
        password="secret123",
        first_name=f"User{idx}",
        last_name="Test",
        date_of_birth="1990-01-01",
        phone_number=f"+5491100000{idx:03d}",
        is_active=True,
    )


@pytest.mark.django_db
def test_participant_can_send_and_list_messages(api_client: Client) -> None:
    seller = _create_user(1)
    buyer = _create_user(2)
    garment = Garment.objects.create(
        seller=seller,
        name="Vintage Jacket",
        description="",
        images=[],
        price_plr=10,
        size="M",
        style="",
        condition="",
        location="",
        tags=[],
    )

    create_response = api_client.post(
        "/api/match/conversations/",
        data={"garment_id": garment.pk},
        content_type="application/json",
        **_auth_header_for(buyer.pk),
    )
    assert create_response.status_code == 201
    conversation_id = create_response.json()["id"]

    send_response = api_client.post(
        f"/api/match/conversations/{conversation_id}/messages",
        data={"content": "Hola, sigue disponible?"},
        content_type="application/json",
        **_auth_header_for(buyer.pk),
    )
    assert send_response.status_code == 201
    assert send_response.json()["content"] == "Hola, sigue disponible?"

    list_response = api_client.get(
        f"/api/match/conversations/{conversation_id}/messages",
        **_auth_header_for(seller.pk),
    )
    assert list_response.status_code == 200
    payload = list_response.json()
    assert len(payload) == 1
    assert payload[0]["content"] == "Hola, sigue disponible?"


@pytest.mark.django_db
def test_non_participant_gets_403_on_message_endpoints(api_client: Client) -> None:
    seller = _create_user(3)
    buyer = _create_user(4)
    stranger = _create_user(5)
    garment = Garment.objects.create(
        seller=seller,
        name="Denim",
        description="",
        images=[],
        price_plr=20,
        size="L",
        style="",
        condition="",
        location="",
        tags=[],
    )
    conversation = Conversation.objects.create(garment=garment, buyer=buyer, seller=seller)

    send_response = api_client.post(
        f"/api/match/conversations/{conversation.pk}/messages",
        data={"content": "No deberia poder mandar"},
        content_type="application/json",
        **_auth_header_for(stranger.pk),
    )
    assert send_response.status_code == 403

    list_response = api_client.get(
        f"/api/match/conversations/{conversation.pk}/messages",
        **_auth_header_for(stranger.pk),
    )
    assert list_response.status_code == 403


@pytest.mark.django_db
def test_open_and_finalized_filters_only_user_conversations(api_client: Client) -> None:
    seller = _create_user(6)
    buyer = _create_user(7)
    other_buyer = _create_user(8)

    open_garment = Garment.objects.create(
        seller=seller,
        name="Open Garment",
        description="",
        images=[],
        price_plr=15,
        size="S",
        style="",
        condition="",
        location="",
        tags=[],
    )
    finalized_garment = Garment.objects.create(
        seller=seller,
        name="Finalized Garment",
        description="",
        images=[],
        price_plr=25,
        size="M",
        style="",
        condition="",
        location="",
        tags=[],
    )
    unrelated_garment = Garment.objects.create(
        seller=seller,
        name="Unrelated",
        description="",
        images=[],
        price_plr=30,
        size="XL",
        style="",
        condition="",
        location="",
        tags=[],
    )

    open_conversation = Conversation.objects.create(garment=open_garment, buyer=buyer, seller=seller, status="open")
    finalized_conversation = Conversation.objects.create(
        garment=finalized_garment,
        buyer=buyer,
        seller=seller,
        status="finalized",
    )
    Conversation.objects.create(garment=unrelated_garment, buyer=other_buyer, seller=seller, status="open")

    open_response = api_client.get("/api/match/conversations/open", **_auth_header_for(buyer.pk))
    assert open_response.status_code == 200
    open_ids = {item["id"] for item in open_response.json()}
    assert open_ids == {open_conversation.pk}

    finalized_response = api_client.get("/api/match/conversations/finalized", **_auth_header_for(buyer.pk))
    assert finalized_response.status_code == 200
    finalized_ids = {item["id"] for item in finalized_response.json()}
    assert finalized_ids == {finalized_conversation.pk}

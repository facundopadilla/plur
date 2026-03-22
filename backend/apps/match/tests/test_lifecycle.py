from __future__ import annotations

import pytest

from apps.match.models import Conversation
from apps.sales.models import Garment, Sale
from apps.sales.services import SaleService
from apps.users.models import User


async def _make_user(email: str, credits: int = 0) -> User:
    user = await User.objects.acreate(
        email=email,
        first_name="Test",
        last_name="User",
        date_of_birth="1990-01-01",
        phone_number="+5491100000000",
        is_active=True,
    )
    if credits:
        user.credits = credits
        await user.asave(update_fields=["credits"])
    return user


async def _make_garment(seller: User, price: int = 10) -> Garment:
    return await Garment.objects.acreate(
        seller=seller,
        name="Test Garment",
        description="",
        images=[],
        price_plr=price,
        size="M",
        style="",
        condition="",
        location="",
        tags=[],
        status="active",
    )


async def _make_conversation(garment: Garment, buyer: User) -> Conversation:
    return await Conversation.objects.acreate(
        garment=garment,
        buyer=buyer,
        seller=garment.seller,
        status="open",
    )


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_confirm_sale_finalizes_linked_conversation() -> None:
    seller = await _make_user("seller-lc1@example.com")
    buyer = await _make_user("buyer-lc1@example.com", credits=1000)
    garment = await _make_garment(seller, price=100)
    conversation = await _make_conversation(garment, buyer)

    sale = await Sale.objects.acreate(
        garment=garment,
        buyer=buyer,
        seller=seller,
        price_plr=100,
        platform_fee=1,
        status="pending",
    )

    await SaleService.confirm(seller=seller, sale_id=sale.pk)

    await conversation.arefresh_from_db()
    assert conversation.status == "finalized"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_reject_sale_finalizes_linked_conversation() -> None:
    seller = await _make_user("seller-lc2@example.com")
    buyer = await _make_user("buyer-lc2@example.com")
    garment = await _make_garment(seller, price=50)
    conversation = await _make_conversation(garment, buyer)

    sale = await Sale.objects.acreate(
        garment=garment,
        buyer=buyer,
        seller=seller,
        price_plr=50,
        platform_fee=1,
        status="pending",
    )

    await SaleService.reject(seller=seller, sale_id=sale.pk)

    await conversation.arefresh_from_db()
    assert conversation.status == "finalized"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_reject_sale_with_no_conversation_does_not_raise() -> None:
    seller = await _make_user("seller-lc3@example.com")
    buyer = await _make_user("buyer-lc3@example.com")
    garment = await _make_garment(seller, price=30)

    sale = await Sale.objects.acreate(
        garment=garment,
        buyer=buyer,
        seller=seller,
        price_plr=30,
        platform_fee=1,
        status="pending",
    )

    await SaleService.reject(seller=seller, sale_id=sale.pk)

    await sale.arefresh_from_db()
    assert sale.status == "rejected"


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_finalized_conversation_appears_in_finalized_list_after_reject() -> None:
    seller = await _make_user("seller-lc4@example.com")
    buyer = await _make_user("buyer-lc4@example.com")
    garment = await _make_garment(seller, price=20)
    await _make_conversation(garment, buyer)

    sale = await Sale.objects.acreate(
        garment=garment,
        buyer=buyer,
        seller=seller,
        price_plr=20,
        platform_fee=1,
        status="pending",
    )

    open_convs = [c async for c in Conversation.objects.filter(buyer=buyer, status="open")]
    assert len(open_convs) == 1

    await SaleService.reject(seller=seller, sale_id=sale.pk)

    open_convs_after = [c async for c in Conversation.objects.filter(buyer=buyer, status="open")]
    finalized_convs = [c async for c in Conversation.objects.filter(buyer=buyer, status="finalized")]
    assert len(open_convs_after) == 0
    assert len(finalized_convs) == 1

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models

from apps.match.models import Conversation, Message
from apps.sales.models import Garment

if TYPE_CHECKING:
    from apps.users.models import User


class ConversationRepository:
    @staticmethod
    async def get_garment_by_id(garment_id: int) -> Garment | None:
        try:
            return await Garment.objects.select_related("seller").aget(pk=garment_id)
        except Garment.DoesNotExist:
            return None

    @staticmethod
    async def create(garment: Garment, buyer: User, seller: User) -> Conversation:
        conversation = Conversation(garment=garment, buyer=buyer, seller=seller)
        await conversation.asave()
        return conversation

    @staticmethod
    async def get_by_id(conversation_id: int) -> Conversation | None:
        try:
            return await Conversation.objects.select_related("garment", "buyer", "seller").aget(pk=conversation_id)
        except Conversation.DoesNotExist:
            return None

    @staticmethod
    async def list_for_user_by_status(user: User, status: str) -> list[Conversation]:
        queryset = Conversation.objects.filter(status=status).filter(models.Q(buyer=user) | models.Q(seller=user))
        queryset = queryset.select_related("garment", "buyer", "seller").order_by("-updated_at")
        return [conversation async for conversation in queryset]

    @staticmethod
    async def find_by_garment_and_buyer(garment_id: int, buyer_id: int) -> Conversation | None:
        try:
            return await Conversation.objects.select_related("garment", "buyer", "seller").aget(
                garment_id=garment_id, buyer_id=buyer_id
            )
        except Conversation.DoesNotExist:
            return None

    @staticmethod
    async def find_open_by_garment_id(garment_id: int) -> Conversation | None:
        try:
            return await Conversation.objects.aget(garment_id=garment_id, status="open")
        except Conversation.DoesNotExist:
            return None

    @staticmethod
    async def finalize(conversation: Conversation) -> None:
        conversation.status = "finalized"
        await conversation.asave(update_fields=["status", "updated_at"])


class MessageRepository:
    @staticmethod
    async def create(conversation: Conversation, sender: User, content: str) -> Message:
        message = Message(conversation=conversation, sender=sender, content=content)
        await message.asave()
        return message

    @staticmethod
    async def list_for_conversation(conversation: Conversation) -> list[Message]:
        queryset = Message.objects.filter(conversation=conversation).select_related("sender").order_by("created_at")
        return [message async for message in queryset]

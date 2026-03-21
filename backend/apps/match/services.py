from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import IntegrityError

from apps.match.repositories import ConversationRepository, MessageRepository

if TYPE_CHECKING:
    from apps.match.models import Conversation, Message
    from apps.users.models import User


class ConversationService:
    @classmethod
    async def create(cls, buyer: User, garment_id: int) -> Conversation:
        garment = await ConversationRepository.get_garment_by_id(garment_id)
        if garment is None:
            raise ValueError("Garment not found")
        if garment.seller_id == buyer.pk:
            raise ValueError("Cannot start a conversation on your own garment")

        try:
            return await ConversationRepository.create(
                garment=garment,
                buyer=buyer,
                seller=garment.seller,
            )
        except IntegrityError as exc:
            raise ValueError("Conversation already exists for this garment and buyer") from exc

    @classmethod
    async def list_open(cls, user: User) -> list[Conversation]:
        return await ConversationRepository.list_for_user_by_status(user=user, status="open")

    @classmethod
    async def list_finalized(cls, user: User) -> list[Conversation]:
        return await ConversationRepository.list_for_user_by_status(user=user, status="finalized")

    @classmethod
    async def get_participant_conversation(cls, user: User, conversation_id: int) -> Conversation:
        conversation = await ConversationRepository.get_by_id(conversation_id)
        if conversation is None:
            raise ValueError("Conversation not found")
        if conversation.buyer_id != user.pk and conversation.seller_id != user.pk:
            raise ValueError("Participant access only")
        return conversation


class MessageService:
    @classmethod
    async def list_for_conversation(cls, user: User, conversation_id: int) -> list[Message]:
        conversation = await ConversationService.get_participant_conversation(
            user=user, conversation_id=conversation_id
        )
        return await MessageRepository.list_for_conversation(conversation=conversation)

    @classmethod
    async def send(cls, user: User, conversation_id: int, content: str) -> Message:
        conversation = await ConversationService.get_participant_conversation(
            user=user, conversation_id=conversation_id
        )

        normalized_content = content.strip()
        if not normalized_content:
            raise ValueError("Message content is required")

        return await MessageRepository.create(conversation=conversation, sender=user, content=normalized_content)

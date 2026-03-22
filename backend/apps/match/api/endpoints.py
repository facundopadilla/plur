from __future__ import annotations

from typing import TYPE_CHECKING

from apps.match.api.router import router
from apps.match.api.schemas import ConversationCreateIn, ConversationOut, ErrorOut, MessageIn, MessageOut
from apps.match.services import ConversationService, MessageService
from core.auth import jwt_auth

if TYPE_CHECKING:
    from django.http import HttpRequest

    from apps.match.models import Conversation, Message
    from apps.users.models import User


@router.get(
    "/conversations/open",
    response=list[ConversationOut],
    auth=jwt_auth,
    summary="List open conversations for authenticated user",
)
async def list_open_conversations(request: HttpRequest) -> list[ConversationOut]:
    user: User = request.auth  # type: ignore[assignment]
    conversations = await ConversationService.list_open(user=user)
    result = []
    for conv in conversations:
        count = await Message.objects.filter(
            conversation=conv, is_read=False
        ).exclude(sender=user).acount()
        result.append(_conversation_to_out(conv, unread_count=count))
    return result


@router.get(
    "/conversations/finalized",
    response=list[ConversationOut],
    auth=jwt_auth,
    summary="List finalized conversations for authenticated user",
)
async def list_finalized_conversations(request: HttpRequest) -> list[ConversationOut]:
    user: User = request.auth  # type: ignore[assignment]
    conversations = await ConversationService.list_finalized(user=user)
    return [_conversation_to_out(conversation) for conversation in conversations]


@router.get(
    "/conversations/{conversation_id}/messages",
    response={200: list[MessageOut], 403: ErrorOut},
    auth=jwt_auth,
    summary="List messages for a conversation",
)
async def list_conversation_messages(
    request: HttpRequest,
    conversation_id: int,
) -> tuple[int, list[MessageOut] | ErrorOut]:
    user: User = request.auth  # type: ignore[assignment]
    try:
        messages = await MessageService.list_for_conversation(user=user, conversation_id=conversation_id)
        # Mark messages from the other person as read
        await Message.objects.filter(
            conversation_id=conversation_id, is_read=False
        ).exclude(sender=user).aupdate(is_read=True)
        return 200, [_message_to_out(message) for message in messages]
    except ValueError as exc:
        return 403, ErrorOut(detail=str(exc))


@router.post(
    "/conversations/{conversation_id}/messages",
    response={201: MessageOut, 400: ErrorOut, 403: ErrorOut},
    auth=jwt_auth,
    summary="Send message in a conversation",
)
async def send_message(
    request: HttpRequest,
    conversation_id: int,
    payload: MessageIn,
) -> tuple[int, MessageOut | ErrorOut]:
    user: User = request.auth  # type: ignore[assignment]
    try:
        message = await MessageService.send(user=user, conversation_id=conversation_id, content=payload.content)
        return 201, _message_to_out(message)
    except ValueError as exc:
        detail = str(exc)
        if detail == "Message content is required":
            return 400, ErrorOut(detail=detail)
        return 403, ErrorOut(detail=detail)


@router.post(
    "/conversations/",
    response={201: ConversationOut, 400: ErrorOut},
    auth=jwt_auth,
    summary="Create conversation for a garment",
)
async def create_conversation(
    request: HttpRequest,
    payload: ConversationCreateIn,
) -> tuple[int, ConversationOut | ErrorOut]:
    user: User = request.auth  # type: ignore[assignment]
    try:
        conversation = await ConversationService.create(buyer=user, garment_id=payload.garment_id)
        return 201, _conversation_to_out(conversation)
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


def _conversation_to_out(conversation: Conversation, unread_count: int = 0) -> ConversationOut:
    return ConversationOut(
        id=conversation.pk,
        garment_id=conversation.garment_id,
        garment_name=conversation.garment.name,
        garment_image=conversation.garment.images[0] if conversation.garment.images else "",
        buyer_id=conversation.buyer_id,
        buyer_name=conversation.buyer.full_name,
        seller_id=conversation.seller_id,
        seller_name=conversation.seller.full_name,
        status=conversation.status,
        unread_count=unread_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def _message_to_out(message: Message) -> MessageOut:
    return MessageOut(
        id=message.pk,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        sender_name=message.sender.full_name,
        content=message.content,
        created_at=message.created_at,
    )

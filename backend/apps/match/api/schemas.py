from __future__ import annotations

from typing import TYPE_CHECKING

from ninja import Schema

if TYPE_CHECKING:
    from datetime import datetime


class ErrorOut(Schema):
    detail: str


class ConversationCreateIn(Schema):
    garment_id: int


class ConversationOut(Schema):
    id: int
    garment_id: int
    garment_name: str
    buyer_id: int
    buyer_name: str
    seller_id: int
    seller_name: str
    status: str
    created_at: datetime
    updated_at: datetime


class MessageIn(Schema):
    content: str


class MessageOut(Schema):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime


def _rebuild_datetime_schemas() -> None:
    from datetime import datetime

    for schema in (ConversationOut, MessageOut):
        schema.model_rebuild(_types_namespace={"datetime": datetime})


_rebuild_datetime_schemas()

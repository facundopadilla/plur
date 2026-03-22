from __future__ import annotations

from typing import ClassVar

from django.conf import settings
from django.db import models

from apps.sales.models import Garment


class Conversation(models.Model):
    STATUS_CHOICES: ClassVar = [
        ("open", "Open"),
        ("finalized", "Finalized"),
    ]

    garment = models.ForeignKey(Garment, on_delete=models.PROTECT)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bought_conversations",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sold_conversations",
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together: ClassVar = [("garment", "buyer")]
        ordering: ClassVar = ["-updated_at"]
        verbose_name = "conversation"
        verbose_name_plural = "conversations"

    def __str__(self) -> str:
        return f"Conversation #{self.pk}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar = ["created_at"]
        verbose_name = "message"
        verbose_name_plural = "messages"

    def __str__(self) -> str:
        return f"Message #{self.pk}"

from __future__ import annotations

from typing import ClassVar
import uuid

from django.conf import settings
from django.db import models


class WebhookEvent(models.Model):
    event_id = models.CharField(max_length=200, unique=True)
    event_type = models.CharField(max_length=100)
    order_id = models.CharField(max_length=200, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "webhook event"
        verbose_name_plural = "webhook events"

    def __str__(self) -> str:
        return f"WebhookEvent {self.event_id} ({self.event_type})"


class PurchaseOrder(models.Model):
    STATUS_PENDING: ClassVar[str] = "pending"
    STATUS_PROCESSING: ClassVar[str] = "processing"
    STATUS_SETTLED: ClassVar[str] = "settled"
    STATUS_FAILED: ClassVar[str] = "failed"

    STATUS_CHOICES: ClassVar[list[tuple[str, str]]] = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_SETTLED, "Settled"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    amount_fiat = models.DecimalField(max_digits=10, decimal_places=2)
    currency_fiat = models.CharField(max_length=3)
    amount_plr = models.DecimalField(max_digits=20, decimal_places=8)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    transak_order_id = models.CharField(max_length=200, blank=True)
    transak_session_data = models.JSONField(default=dict)
    idempotency_key = models.UUIDField(unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar = ["-created_at"]
        verbose_name = "purchase order"
        verbose_name_plural = "purchase orders"

    def __str__(self) -> str:
        return f"PurchaseOrder #{self.pk} ({self.status})"

"""Sales domain models: Garment, Sale, CreditTransaction."""

from __future__ import annotations

from typing import ClassVar

from django.conf import settings
from django.db import models


class Garment(models.Model):
    """A garment published for sale by a user."""

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="garments",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    images = models.JSONField(default=list)
    price_plr = models.PositiveIntegerField()
    size = models.CharField(max_length=50, blank=True, default="")
    style = models.CharField(max_length=50, blank=True, default="")
    condition = models.CharField(max_length=50, blank=True, default="")
    location = models.CharField(max_length=100, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    tags = models.JSONField(default=list)
    status = models.CharField(
        max_length=10,
        choices=[("active", "Active"), ("sold", "Sold")],
        default="active",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar = ["-created_at"]
        verbose_name = "garment"
        verbose_name_plural = "garments"

    def __str__(self) -> str:
        """Return the garment name."""
        return self.name


class Sale(models.Model):
    """A sale transaction between a buyer and a seller."""

    STATUS_CHOICES: ClassVar = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
    ]

    garment = models.ForeignKey(Garment, on_delete=models.CASCADE, related_name="sales")
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="purchases",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sales_as_seller",
    )
    price_plr = models.PositiveIntegerField()
    platform_fee = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    tx_hash = models.CharField(max_length=66, blank=True, default="")

    class Meta:
        ordering: ClassVar = ["-created_at"]
        verbose_name = "sale"
        verbose_name_plural = "sales"

    def __str__(self) -> str:
        """Return a summary of the sale."""
        return f"Sale #{self.pk}: {self.garment.name} ({self.status})"


class CreditTransaction(models.Model):
    """A record of credit movement for a user."""

    TX_TYPE_CHOICES: ClassVar = [
        ("earned", "Earned"),
        ("spent", "Spent"),
        ("purchased", "Purchased"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="credit_transactions",
    )
    sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True)
    tx_type = models.CharField(max_length=10, choices=TX_TYPE_CHOICES)
    amount = models.IntegerField()
    description = models.CharField(max_length=255)
    tx_hash = models.CharField(max_length=66, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar = ["-created_at"]
        verbose_name = "credit transaction"
        verbose_name_plural = "credit transactions"

    def __str__(self) -> str:
        """Return a summary of the transaction."""
        return f"{self.tx_type}: {self.amount} PLR — {self.description}"

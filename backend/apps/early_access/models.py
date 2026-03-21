from __future__ import annotations

from typing import ClassVar

from django.db import models


class EarlyAccessSignup(models.Model):
    """A user who signed up for early access."""

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar = ["-created_at"]
        verbose_name = "early access signup"
        verbose_name_plural = "early access signups"

    def __str__(self) -> str:
        """Return the signup email."""
        return self.email


class WishlistItem(models.Model):
    """A garment photo uploaded by an early access user."""

    signup = models.ForeignKey(
        EarlyAccessSignup,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    photo = models.ImageField(upload_to="early_access/wishlist/")
    description = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar = ["-created_at"]
        verbose_name = "wishlist item"
        verbose_name_plural = "wishlist items"

    def __str__(self) -> str:
        """Return the item description or photo path."""
        return self.description or str(self.photo)

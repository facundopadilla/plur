from __future__ import annotations

from django.db import IntegrityError
from ninja.files import UploadedFile

from apps.early_access.models import EarlyAccessSignup, WishlistItem


class EarlyAccessRepository:
    """Database access for early access signups."""

    @staticmethod
    async def create_signup(*, email: str, name: str) -> EarlyAccessSignup:
        """Create a new early access signup.

        Raises:
            IntegrityError: If the email already exists.
        """
        signup = EarlyAccessSignup(email=email.lower().strip(), name=name.strip())
        await signup.asave()
        return signup

    @staticmethod
    async def get_by_email(email: str) -> EarlyAccessSignup | None:
        """Get a signup by email, or None if not found."""
        try:
            return await EarlyAccessSignup.objects.aget(email=email.lower().strip())
        except EarlyAccessSignup.DoesNotExist:
            return None

    @staticmethod
    async def add_wishlist_item(
        *,
        signup: EarlyAccessSignup,
        photo: UploadedFile,
        description: str,
    ) -> WishlistItem:
        """Add a wishlist item to a signup."""
        item = WishlistItem(
            signup=signup,
            photo=photo,
            description=description.strip(),
        )
        await item.asave()
        return item

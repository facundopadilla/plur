from __future__ import annotations

import json

from django.db import IntegrityError
from ninja.files import UploadedFile

from apps.early_access.models import EarlyAccessSignup
from apps.early_access.repositories import EarlyAccessRepository


class EarlyAccessService:
    """Business logic for early access signups."""

    MAX_PHOTOS = 5
    MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

    @classmethod
    async def signup(
        cls,
        *,
        email: str,
        name: str,
        photos: list[UploadedFile],
        descriptions_json: str,
    ) -> EarlyAccessSignup:
        """Process an early access signup with optional wishlist photos.

        Args:
            email: User email address.
            name: User name (optional).
            photos: List of uploaded photo files.
            descriptions_json: JSON-encoded list of description strings.

        Returns:
            The created or existing EarlyAccessSignup.

        Raises:
            ValueError: If validation fails.
        """
        if not email or not email.strip():
            msg = "El email es obligatorio"
            raise ValueError(msg)

        if len(photos) > cls.MAX_PHOTOS:
            msg = f"Máximo {cls.MAX_PHOTOS} fotos permitidas"
            raise ValueError(msg)

        for photo in photos:
            if photo.size and photo.size > cls.MAX_PHOTO_SIZE:
                msg = f"La foto '{photo.name}' supera los 5MB"
                raise ValueError(msg)
            if photo.content_type not in cls.ALLOWED_TYPES:
                msg = f"Formato no soportado: {photo.content_type}. Usá JPG, PNG o WebP."
                raise ValueError(msg)

        try:
            descriptions: list[str] = json.loads(descriptions_json) if descriptions_json else []
        except (json.JSONDecodeError, TypeError):
            descriptions = []

        # Create or retrieve signup
        try:
            signup = await EarlyAccessRepository.create_signup(
                email=email,
                name=name,
            )
        except IntegrityError:
            existing = await EarlyAccessRepository.get_by_email(email)
            if existing is None:
                msg = "Error al procesar el registro"
                raise ValueError(msg)
            signup = existing

        # Attach wishlist items
        for i, photo in enumerate(photos):
            desc = descriptions[i] if i < len(descriptions) else ""
            await EarlyAccessRepository.add_wishlist_item(
                signup=signup,
                photo=photo,
                description=desc,
            )

        return signup

"""JWT bearer authentication for Django Ninja endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
import jwt
from ninja.security import HttpBearer

from apps.users.models import User

if TYPE_CHECKING:
    from django.http import HttpRequest


class JWTBearer(HttpBearer):
    """Authenticate requests using a JWT Bearer token.

    Decodes the access token from the Authorization header and attaches
    the User instance to ``request.auth``.
    """

    async def authenticate(self, request: HttpRequest, token: str) -> User | None:
        """Validate the JWT token and return the associated user.

        Args:
            request: The incoming HTTP request.
            token: The raw JWT token string from the Authorization header.

        Returns:
            The authenticated User instance or None if authentication fails.
        """
        try:
            payload: dict[str, Any] = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

        if payload.get("type") != "access":
            return None

        user_id = int(str(payload["sub"]))
        try:
            return await User.objects.aget(pk=user_id, is_active=True)
        except User.DoesNotExist:
            return None


jwt_auth = JWTBearer()

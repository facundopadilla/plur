"""Business logic for authentication and user management."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import secrets
from typing import TYPE_CHECKING

from asgiref.sync import sync_to_async
from django.conf import settings
import jwt
from loguru import logger

from apps.users.repositories import UserRepository
from core.email import send_activation_email, send_password_reset_email

if TYPE_CHECKING:
    from apps.users.models import User


class AuthService:
    """Service for JWT authentication and user lifecycle operations."""

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ------------------------------------------------------------------ #
    # Token helpers                                                         #
    # ------------------------------------------------------------------ #

    @classmethod
    def _create_token(cls, user_id: int, token_type: str, expire_delta: timedelta) -> str:
        """Encode a JWT token with the given claims.

        Args:
            user_id: The subject of the token.
            token_type: Either 'access' or 'refresh'.
            expire_delta: How long until the token expires.

        Returns:
            A signed JWT string.
        """
        payload = {
            "sub": str(user_id),
            "exp": datetime.now(UTC) + expire_delta,
            "iat": datetime.now(UTC),
            "type": token_type,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    @classmethod
    def create_access_token(cls, user_id: int) -> str:
        """Create a short-lived access token.

        Args:
            user_id: The ID of the authenticated user.

        Returns:
            A signed JWT access token string.
        """
        return cls._create_token(
            user_id,
            "access",
            timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

    @classmethod
    def create_refresh_token(cls, user_id: int) -> str:
        """Create a long-lived refresh token.

        Args:
            user_id: The ID of the authenticated user.

        Returns:
            A signed JWT refresh token string.
        """
        return cls._create_token(
            user_id,
            "refresh",
            timedelta(days=cls.REFRESH_TOKEN_EXPIRE_DAYS),
        )

    @staticmethod
    def decode_token(token: str) -> dict[str, object]:
        """Decode and validate a JWT token.

        Args:
            token: The JWT string to decode.

        Returns:
            The decoded payload dictionary.

        Raises:
            jwt.ExpiredSignatureError: If the token has expired.
            jwt.InvalidTokenError: If the token is invalid.
        """
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

    # ------------------------------------------------------------------ #
    # Auth operations                                                       #
    # ------------------------------------------------------------------ #

    @classmethod
    async def register(
        cls,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        phone_number: str,
    ) -> User:
        """Register a new inactive user and generate an activation code.

        Args:
            email: The user's email address.
            password: The plain-text password.
            first_name: The user's first name.
            last_name: The user's last name.
            date_of_birth: ISO 8601 date string (YYYY-MM-DD).
            phone_number: The user's phone number.

        Returns:
            The newly created User instance.

        Raises:
            ValueError: If the email is already registered.
        """
        if await UserRepository.email_exists(email):
            raise ValueError("Email already registered")

        activation_code = f"{secrets.randbelow(1_000_000):06d}"
        user = await UserRepository.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            phone_number=phone_number,
            activation_code=activation_code,
        )
        logger.info("User registered", email=email, activation_code=activation_code)
        # Best-effort email — don't block registration on email failure
        try:
            await send_activation_email(email=user.email, code=activation_code, first_name=user.first_name)
        except Exception:
            logger.warning("Failed to send activation email, user can request resend", email=email)
        return user

    @classmethod
    async def activate(cls, email: str, code: str) -> User:
        """Activate a user account with the emailed verification code.

        Args:
            email: The user's email address.
            code: The 6-digit activation code.

        Returns:
            The activated User instance.

        Raises:
            ValueError: If the user is not found, already active, or code is wrong.
        """
        user = await UserRepository.get_by_email(email)
        if user is None:
            raise ValueError("User not found")
        if user.is_active:
            raise ValueError("Account already activated")
        if user.activation_code != code:
            raise ValueError("Invalid activation code")

        user.is_active = True
        user.activation_code = ""
        await user.asave(update_fields=["is_active", "activation_code"])
        logger.info("User activated", email=email)
        return user

    @classmethod
    async def login(cls, email: str, password: str) -> tuple[str, str]:
        """Authenticate a user and return JWT token pair.

        Args:
            email: The user's email address.
            password: The plain-text password to verify.

        Returns:
            A tuple of (access_token, refresh_token).

        Raises:
            ValueError: If credentials are invalid or account is not active.
        """
        user = await UserRepository.get_by_email(email)
        if user is None:
            raise ValueError("Invalid credentials")

        password_valid = await sync_to_async(user.check_password)(password)
        if not password_valid:
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account not yet activated. Check your email for the activation code.")

        access_token = cls.create_access_token(user.id)
        refresh_token = cls.create_refresh_token(user.id)
        logger.info("User logged in", user_id=user.id)
        return access_token, refresh_token

    @classmethod
    async def refresh(cls, refresh_token: str) -> str:
        """Issue a new access token from a valid refresh token.

        Args:
            refresh_token: The JWT refresh token string.

        Returns:
            A new JWT access token string.

        Raises:
            ValueError: If the refresh token is expired or invalid.
        """
        try:
            payload = cls.decode_token(refresh_token)
        except jwt.ExpiredSignatureError as exc:
            raise ValueError("Refresh token expired") from exc
        except jwt.InvalidTokenError as exc:
            raise ValueError("Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")

        user_id = int(str(payload["sub"]))
        return cls.create_access_token(user_id)

    @classmethod
    async def request_password_reset(cls, email: str) -> None:
        """Generate and store a password reset code for the given email.

        Does not reveal whether the email exists to prevent enumeration.

        Args:
            email: The email address requesting a reset.
        """
        user = await UserRepository.get_by_email(email)
        if user is None:
            logger.info("Password reset requested for unknown email", email=email)
            return

        reset_code = f"{secrets.randbelow(1_000_000):06d}"
        user.reset_code = reset_code
        await user.asave(update_fields=["reset_code"])
        logger.info("Password reset code generated", email=email, reset_code=reset_code)
        # Best-effort email
        try:
            await send_password_reset_email(email=user.email, code=reset_code, first_name=user.first_name)
        except Exception:
            logger.warning("Failed to send password reset email", email=email)

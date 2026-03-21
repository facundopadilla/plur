"""Pydantic schemas for auth API input and output."""

from __future__ import annotations

from ninja import Schema
from pydantic import Field


class RegisterOut(Schema):
    """Response schema for successful user registration."""

    id: int
    email: str
    message: str
    activation_code: str  # TODO: Remove once Resend is configured — dev-only hack


class TokenOut(Schema):
    """Response schema containing the JWT token pair."""

    access_token: str
    refresh_token: str


class AccessTokenOut(Schema):
    """Response schema containing only a new access token."""

    access_token: str


class ActivateOut(Schema):
    """Response schema for successful account activation."""

    message: str


class PasswordResetOut(Schema):
    """Response schema for password reset requests."""

    message: str


class ErrorOut(Schema):
    """Generic error response schema matching Django Ninja's error shape."""

    detail: str


# ------------------------------------------------------------------ #
# Input schemas                                                         #
# ------------------------------------------------------------------ #


class LoginIn(Schema):
    """Input schema for user login."""

    email: str
    password: str


class ActivateIn(Schema):
    """Input schema for account activation."""

    email: str
    code: str = Field(..., min_length=6, max_length=6)


class PasswordResetIn(Schema):
    """Input schema for password reset requests."""

    email: str


class RefreshIn(Schema):
    """Input schema for token refresh (token is read from cookie)."""

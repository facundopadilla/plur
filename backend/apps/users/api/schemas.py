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


class UserMeOut(Schema):
    """Response schema for the authenticated user's profile."""

    id: int
    email: str
    first_name: str
    last_name: str


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


# ------------------------------------------------------------------ #
# Preferences schemas                                                  #
# ------------------------------------------------------------------ #


class PreferencesOut(Schema):
    """Response schema for user preferences."""

    id: int
    styles: list[str]
    sizes: list[str]
    colors: list[str]
    discovery_radius_km: int
    proximity_enabled: bool
    created_at: str
    updated_at: str


class PreferencesIn(Schema):
    """Input schema for updating user preferences (all fields optional)."""

    styles: list[str] | None = None
    sizes: list[str] | None = None
    colors: list[str] | None = None
    discovery_radius_km: int | None = Field(None, ge=1, le=500)
    proximity_enabled: bool | None = None

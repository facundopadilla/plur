"""Tests for user preferences API."""

from __future__ import annotations

import pytest

from apps.users.models import User, UserPreferences
from apps.users.services import PreferencesService


@pytest.fixture
async def test_user(db) -> User:
    """Create a test user."""
    import secrets

    email = f"testuser{secrets.token_hex(4)}@example.com"
    return await User.objects.acreate(
        email=email,
        first_name="Test",
        last_name="User",
        date_of_birth="1990-01-01",
        phone_number="+5491112345678",
        is_active=True,
    )


@pytest.mark.asyncio
@pytest.mark.django_db
async def test_get_preferences_creates_with_defaults(test_user: User) -> None:
    """GET /me/preferences returns default preferences if none exist."""
    prefs = await PreferencesService.get(test_user)

    assert prefs.user_id == test_user.id
    assert prefs.styles == []
    assert prefs.sizes == []
    assert prefs.colors == []
    assert prefs.discovery_radius_km == 50
    assert prefs.proximity_enabled is False


@pytest.mark.asyncio
@pytest.mark.django_db
async def test_update_preferences_partial(test_user: User) -> None:
    """PUT /me/preferences updates only provided fields."""
    prefs = await PreferencesService.update(
        test_user,
        {"styles": ["casual", "formal"], "discovery_radius_km": 100},
    )

    assert prefs.styles == ["casual", "formal"]
    assert prefs.discovery_radius_km == 100
    assert prefs.sizes == []
    assert prefs.proximity_enabled is False


@pytest.mark.asyncio
@pytest.mark.django_db
async def test_update_preferences_invalid_radius(test_user: User) -> None:
    """PUT /me/preferences with invalid radius raises ValueError."""
    with pytest.raises(ValueError, match="discovery_radius_km must be between 1 and 500"):
        await PreferencesService.update(test_user, {"discovery_radius_km": 1000})


@pytest.mark.asyncio
@pytest.mark.django_db
async def test_update_preferences_radius_zero(test_user: User) -> None:
    """PUT /me/preferences with radius 0 raises ValueError."""
    with pytest.raises(ValueError, match="discovery_radius_km must be between 1 and 500"):
        await PreferencesService.update(test_user, {"discovery_radius_km": 0})


@pytest.mark.asyncio
@pytest.mark.django_db
async def test_update_preferences_persists(test_user: User) -> None:
    """Preferences update is persisted to database."""
    await PreferencesService.update(
        test_user,
        {"colors": ["black", "white"], "sizes": ["M", "L"]},
    )

    # Fetch fresh from DB
    prefs = await UserPreferences.objects.aget(user=test_user)
    assert prefs.colors == ["black", "white"]
    assert prefs.sizes == ["M", "L"]

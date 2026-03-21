"""Auth API endpoint handlers — thin layer, delegates to AuthService."""

from __future__ import annotations

from typing import TYPE_CHECKING

from asgiref.sync import sync_to_async
from django.conf import settings
from loguru import logger
from ninja import File, Form

from apps.sales.models import CreditTransaction
from apps.users.api.router import router

if TYPE_CHECKING:
    from datetime import date

    from django.http import HttpRequest, HttpResponse
    from ninja.files import UploadedFile
from apps.users.api.schemas import (
    AccessTokenOut,
    ActivateIn,
    ActivateOut,
    ErrorOut,
    LoginIn,
    PasswordResetIn,
    PasswordResetOut,
    PreferencesIn,
    PreferencesOut,
    RegisterOut,
    TokenOut,
)
from apps.users.models import User
from apps.users.services import AuthService, PreferencesService
from core.auth import jwt_auth


@router.post(
    "/register",
    response={201: RegisterOut, 409: ErrorOut},
    summary="Register a new user",
)
async def register(
    request: HttpRequest,
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    date_of_birth: date = Form(...),  # noqa: B008
    phone_number: str = Form(...),
    profile_picture: UploadedFile | None = File(None),  # noqa: B008
) -> tuple[int, RegisterOut | ErrorOut]:
    """Register a new user account.

    The account is created in an inactive state. An activation code is
    returned in the response (in production this would be emailed).
    """
    try:
        user = await AuthService.register(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=str(date_of_birth),
            phone_number=phone_number,
        )
        # Save profile picture if provided
        if profile_picture is not None:
            user.profile_picture = profile_picture  # type: ignore[assignment]
            await user.asave(update_fields=["profile_picture"])

        return 201, RegisterOut(
            id=user.id,
            email=user.email,
            message="User registered. Please activate your account.",
            activation_code=user.activation_code,
        )
    except ValueError as exc:
        return 409, ErrorOut(detail=str(exc))


@router.post(
    "/token",
    response={200: TokenOut, 401: ErrorOut},
    summary="Login and obtain JWT token pair",
)
async def login(
    request: HttpRequest,
    payload: LoginIn,
    response: HttpResponse,
) -> tuple[int, TokenOut | ErrorOut]:
    """Authenticate with email and password.

    On success, returns an access token in the response body and sets the
    refresh token as an httpOnly cookie.
    """
    try:
        access_token, refresh_token = await AuthService.login(payload.email, payload.password)
        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=7 * 24 * 60 * 60,
        )
        return 200, TokenOut(access_token=access_token, refresh_token=refresh_token)
    except ValueError as exc:
        return 401, ErrorOut(detail=str(exc))


@router.post(
    "/refresh",
    response={200: AccessTokenOut, 401: ErrorOut},
    summary="Refresh the access token",
)
async def refresh_token(
    request: HttpRequest,
) -> tuple[int, AccessTokenOut | ErrorOut]:
    """Issue a new access token using the refresh token stored in the httpOnly cookie."""
    token = request.COOKIES.get("refresh_token", "")
    if not token:
        return 401, ErrorOut(detail="No refresh token found")
    try:
        access_token = await AuthService.refresh(token)
        return 200, AccessTokenOut(access_token=access_token)
    except ValueError as exc:
        return 401, ErrorOut(detail=str(exc))


@router.post(
    "/activate",
    response={200: ActivateOut, 400: ErrorOut},
    summary="Activate account with email verification code",
)
async def activate(
    request: HttpRequest,
    payload: ActivateIn,
) -> tuple[int, ActivateOut | ErrorOut]:
    """Activate a user account using the 6-digit code sent to their email."""
    try:
        await AuthService.activate(payload.email, payload.code)
        user = await User.objects.aget(email=payload.email)
        user.credits = settings.PLR_WELCOME_CREDITS
        await user.asave(update_fields=["credits"])
        await CreditTransaction.objects.acreate(
            user=user,
            tx_type="earned",
            amount=settings.PLR_WELCOME_CREDITS,
            description="Bienvenida a Plur",
        )
        # Mint welcome credits on-chain to user's wallet (fire-and-forget)
        try:
            from core.blockchain import mint_plr

            if user.wallet_address:
                tx_hash = await sync_to_async(mint_plr)(
                    amount_plr=settings.PLR_WELCOME_CREDITS,
                    reason="Bienvenida a Plur",
                    reference_id_str=f"welcome-{user.pk}",
                    to_address=user.wallet_address,
                )
                await CreditTransaction.objects.filter(user=user, description="Bienvenida a Plur").aupdate(
                    tx_hash=tx_hash
                )
                logger.info("On-chain mint for welcome credits", user_id=user.pk, tx_hash=tx_hash)
        except Exception:
            logger.exception("Blockchain mint failed for welcome credits", user_id=user.pk)
        return 200, ActivateOut(message="Account activated successfully.")
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))


@router.post(
    "/password-reset",
    response={200: PasswordResetOut},
    summary="Request a password reset code",
)
async def password_reset(
    request: HttpRequest,
    payload: PasswordResetIn,
) -> PasswordResetOut:
    """Request a password reset code.

    Always returns a success message regardless of whether the email exists,
    to prevent account enumeration.
    """
    await AuthService.request_password_reset(payload.email)
    return PasswordResetOut(message="If an account exists with that email, a reset code has been sent.")


@router.get(
    "/me/preferences",
    response={200: PreferencesOut, 401: ErrorOut},
    auth=jwt_auth,
    summary="Get current user's preferences",
)
async def get_preferences(request: HttpRequest) -> tuple[int, PreferencesOut | ErrorOut]:
    """Get the authenticated user's preferences (auto-creates with defaults if missing)."""
    try:
        user = request.auth
        if user is None:
            return 401, ErrorOut(detail="Not authenticated")
        prefs = await PreferencesService.get(user)
        return 200, PreferencesOut(
            id=prefs.id,
            styles=prefs.styles,
            sizes=prefs.sizes,
            colors=prefs.colors,
            discovery_radius_km=prefs.discovery_radius_km,
            proximity_enabled=prefs.proximity_enabled,
            created_at=prefs.created_at.isoformat(),
            updated_at=prefs.updated_at.isoformat(),
        )
    except Exception:
        logger.exception("Error retrieving preferences")
        return 500, ErrorOut(detail="Internal server error")


@router.put(
    "/me/preferences",
    response={200: PreferencesOut, 400: ErrorOut, 401: ErrorOut},
    auth=jwt_auth,
    summary="Update current user's preferences",
)
async def update_preferences(
    request: HttpRequest,
    payload: PreferencesIn,
) -> tuple[int, PreferencesOut | ErrorOut]:
    """Update the authenticated user's preferences (partial update).

    Only provided fields are updated. Returns the updated preferences.
    """
    try:
        user = request.auth
        if user is None:
            return 401, ErrorOut(detail="Not authenticated")

        update_data = {k: v for k, v in payload.dict().items() if v is not None}

        prefs = await PreferencesService.update(user, update_data)
        return 200, PreferencesOut(
            id=prefs.id,
            styles=prefs.styles,
            sizes=prefs.sizes,
            colors=prefs.colors,
            discovery_radius_km=prefs.discovery_radius_km,
            proximity_enabled=prefs.proximity_enabled,
            created_at=prefs.created_at.isoformat(),
            updated_at=prefs.updated_at.isoformat(),
        )
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))
    except Exception:
        logger.exception("Error updating preferences")
        return 500, ErrorOut(detail="Internal server error")

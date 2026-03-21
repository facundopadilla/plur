from __future__ import annotations

from django.http import HttpRequest
from ninja import File, Form
from ninja.files import UploadedFile

from apps.early_access.api.router import router
from apps.early_access.api.schemas import ErrorOut, SignupOut
from apps.early_access.services import EarlyAccessService


@router.post(
    "/signup",
    response={201: SignupOut, 400: ErrorOut},
    summary="Register for early access",
)
async def signup(
    request: HttpRequest,
    email: str = Form(...),
    name: str = Form(""),
    descriptions: str = Form("[]"),
    photos: list[UploadedFile] = File(default=[]),
) -> tuple[int, SignupOut | ErrorOut]:
    """Register for early access with optional wishlist photos."""
    try:
        signup_obj = await EarlyAccessService.signup(
            email=email,
            name=name,
            photos=photos,
            descriptions_json=descriptions,
        )
        items_count = await signup_obj.wishlist_items.acount()
        return 201, SignupOut(
            message="¡Registro exitoso! Te contactaremos pronto.",
            items_count=items_count,
        )
    except ValueError as exc:
        return 400, ErrorOut(detail=str(exc))

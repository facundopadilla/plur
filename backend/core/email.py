"""Async email utilities wrapping Django's email framework.

django-anymail is synchronous internally (uses requests). We wrap with
sync_to_async to avoid blocking the async event loop, consistent with
the pattern already used in apps/users/services.py for check_password.

Note: For true async without a thread pool, the `resend` SDK offers
`resend.Emails.send_async()` via httpx — consider migrating if needed.
"""

from __future__ import annotations

from asgiref.sync import sync_to_async
from django.core.mail import send_mail
from django.template.loader import render_to_string
from loguru import logger


async def send_activation_email(email: str, code: str, first_name: str) -> None:
    """Send account activation code to a newly registered user.

    Args:
        email: The recipient's email address.
        code: The 6-digit activation code.
        first_name: The user's first name for personalization.
    """
    subject = "Plur — Activá tu cuenta"
    html = render_to_string("emails/activation_code.html", {"code": code, "first_name": first_name})
    plain = f"Hola {first_name}, tu código de activación es: {code}"
    await _send(subject=subject, plain=plain, html=html, recipient=email)
    logger.info("Activation email sent", email=email)


async def send_password_reset_email(email: str, code: str, first_name: str) -> None:
    """Send password reset code to a user.

    Args:
        email: The recipient's email address.
        code: The 6-digit reset code.
        first_name: The user's first name for personalization.
    """
    subject = "Plur — Código de recuperación"
    html = render_to_string("emails/password_reset_code.html", {"code": code, "first_name": first_name})
    plain = f"Hola {first_name}, tu código de recuperación es: {code}"
    await _send(subject=subject, plain=plain, html=html, recipient=email)
    logger.info("Password reset email sent", email=email)


async def _send(subject: str, plain: str, html: str, recipient: str) -> None:
    """Wrap Django's sync send_mail for use in an async context.

    Args:
        subject: The email subject line.
        plain: Plain-text fallback body.
        html: HTML body.
        recipient: The recipient email address.

    Raises:
        Exception: Re-raises any sending error after logging.
    """
    try:
        await sync_to_async(send_mail)(
            subject=subject,
            message=plain,
            from_email=None,  # uses DEFAULT_FROM_EMAIL from settings
            recipient_list=[recipient],
            html_message=html,
        )
    except Exception:
        logger.exception("Failed to send email", recipient=recipient, subject=subject)
        raise

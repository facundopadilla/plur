"""ASGI config for the Plur project."""

from __future__ import annotations

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

from core.logging import setup_logging

setup_logging()

application = get_asgi_application()

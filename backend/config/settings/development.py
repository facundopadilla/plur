"""Development settings.

DEBUG=True, relaxed security. For use in local and CI environments.
"""

from __future__ import annotations

import os

from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-dev-key-change-in-prod-plur")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "plur_dev"),
        "USER": os.environ.get("POSTGRES_USER", "postgres"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# Dev-only apps
INSTALLED_APPS += ["django_extensions"]  # noqa: F405

# CORS — allow Vite dev server
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
CORS_ALLOW_CREDENTIALS = True

# Email — console backend (prints to stdout, no API key needed)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

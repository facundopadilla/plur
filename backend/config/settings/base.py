"""Base settings shared across all environments.

Never use this file directly. Always use a specific environment settings file.
"""

from __future__ import annotations

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
# Must be overridden by environment-specific settings files.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "ninja",
    "anymail",
    # Project apps
    "apps.users",
    "apps.sales",
]

AUTH_USER_MODEL = "users.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.RequestLoggingMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (user-uploaded content)
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "Plur <noreply@plur.app>")

# Avalanche / PLR Token
AVALANCHE_RPC_URL = os.environ.get(
    "AVALANCHE_RPC_URL",
    "https://api.avax-test.network/ext/bc/C/rpc",  # Fuji testnet by default
)
AVALANCHE_BACKEND_PRIVATE_KEY = os.environ.get("AVALANCHE_BACKEND_PRIVATE_KEY", "")
PLR_TOKEN_ADDRESS = os.environ.get(
    "PLR_TOKEN_ADDRESS",
    "0x159a6f159edaCD4b36947fD54B4BaDD87598de29",  # Deployed on Fuji
)
AVALANCHE_BACKEND_WALLET_ADDRESS = os.environ.get(
    "AVALANCHE_BACKEND_WALLET_ADDRESS",
    "0xe2D919b66F1Df21644Bf8dF638Bf9C04e383c2E4",
)

# PLR business logic constants
PLR_WELCOME_CREDITS = int(os.environ.get("PLR_WELCOME_CREDITS", "30"))  # 30 PLR on signup
PLR_AI_IMAGE_COST = int(os.environ.get("PLR_AI_IMAGE_COST", "1"))  # 1 PLR per AI image
PLATFORM_FEE_RATE = float(os.environ.get("PLATFORM_FEE_RATE", "0.005"))  # 0.5%

FEATURE_FLAGS = {
    "dashboard_ia_v2": False,
    "match_chat": False,
    "proximity_sort": False,
    "transak_onramp": False,
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Django 5.2 REST API backend with Django Ninja v1.6.2, deployed on Render.com.
Fully async architecture. PostgreSQL 18 as primary database, Redis for caching/queues.

---

## Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Language      | Python 3.11.12                    |
| Framework     | Django 5.2                        |
| API           | Django Ninja 1.6.2               |
| Database      | PostgreSQL 18                     |
| Cache / Queue | Redis                             |
| Package mgr   | uv                                |
| Deployment    | Render.com                        |
| Logging       | Loguru                            |

---

## Common Commands

```bash
# Install dependencies
uv sync

# Add a new dependency
uv add <package>

# Add a dev dependency
uv add --dev <package>

# Run development server
uv run python manage.py runserver

# Database migrations
uv run python manage.py makemigrations
uv run python manage.py migrate

# Create superuser
uv run python manage.py createsuperuser

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov --cov-report=term-missing

# Linting and formatting
uv run ruff check .
uv run ruff format .

# Security check
uv run bandit -r . -c pyproject.toml

# Pre-commit on all files
uv run pre-commit run --all-files

# Update baseline for detect-secrets
uv run detect-secrets scan > .secrets.baseline

# Django shell
uv run python manage.py shell_plus

# Check deployment configuration
uv run python manage.py check --deploy
```

---

## Project Structure

```
project/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py            # Shared config (never use directly)
│   │   ├── local.py           # Personal local overrides (git-ignored)
│   │   ├── development.py     # Dev server: DEBUG=True, relaxed security
│   │   └── production.py      # Render.com: DEBUG=False, strict security
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   └── <app_name>/
│       ├── __init__.py
│       ├── api/
│       │   ├── __init__.py
│       │   ├── router.py      # Ninja router
│       │   ├── schemas.py     # Pydantic schemas (in/out)
│       │   └── endpoints.py   # Async endpoint handlers
│       ├── models.py
│       ├── services.py        # Business logic (async)
│       ├── repositories.py    # DB access layer (async)
│       ├── exceptions.py
│       └── tests/
│           ├── test_api.py
│           ├── test_services.py
│           └── test_models.py
├── core/
│   ├── logging.py             # Loguru setup
│   ├── exceptions.py          # Global exception handlers
│   ├── middleware.py
│   └── utils.py
├── docker/
│   ├── local.yml              # PostgreSQL + Redis (no app container)
│   ├── development.yml        # PostgreSQL + Redis + app with hot-reload
│   └── production.yml         # Full stack mirroring Render (for smoke tests)
├── pyproject.toml
├── .pre-commit-config.yaml
├── .secrets.baseline
├── render.yaml
└── manage.py
```

---

## Async Rules — CRITICAL

> **ALL code that touches I/O MUST be async. No exceptions unless technically impossible.**

### Required async patterns

```python
# ✅ ALWAYS — DB queries
async def get_user(user_id: int) -> User:
    return await User.objects.aget(id=user_id)

# ✅ ALWAYS — external HTTP calls (use httpx, never requests)
async def call_external_api(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# ✅ ALWAYS — Redis operations
async def get_cache(key: str) -> str | None:
    return await redis_client.get(key)

# ✅ ALWAYS — Django Ninja endpoints
@router.get("/users/{user_id}", response=UserOut)
async def get_user_endpoint(request: HttpRequest, user_id: int) -> UserOut:
    ...

# ✅ ALWAYS — ORM querysets: use async iterators
async def list_active_users() -> list[User]:
    return [user async for user in User.objects.filter(is_active=True)]
```

### When sync IS acceptable

Only use sync code when:
1. The library has no async support AND no async wrapper exists
2. CPU-bound operations (no I/O involved)
3. Django management commands (not request-handling code)

When you must use sync in an async context, run it in a thread pool:

```python
from asgiref.sync import sync_to_async

result = await sync_to_async(some_sync_function)(arg1, arg2)
```

### Forbidden in async context

- `requests` library → use `httpx` with `AsyncClient`
- `time.sleep()` → use `asyncio.sleep()`
- Synchronous ORM (`.get()`, `.filter()`, `.save()`) → use `.aget()`, `.afilter()`, `.asave()`
- Blocking file I/O without `asyncio` or `aiofiles`

---

## Django Ninja Conventions

```python
# router.py — one router per app
from ninja import Router

router = Router(tags=["users"])

# schemas.py — always separate In/Out schemas
from ninja import Schema
from pydantic import Field

class UserIn(Schema):
    """Schema for creating a user."""
    email: str
    full_name: str = Field(..., min_length=2, max_length=100)

class UserOut(Schema):
    """Schema for user responses."""
    id: int
    email: str
    full_name: str
    created_at: datetime

# endpoints.py — thin, delegates to services
@router.post("/", response={201: UserOut}, auth=django_auth)
async def create_user(request: HttpRequest, payload: UserIn) -> tuple[int, UserOut]:
    """Create a new user."""
    user = await user_service.create(payload)
    return 201, user
```

### API design rules

- Endpoints must be **thin**: validate input → call service → return response
- Business logic always in `services.py`
- DB access always in `repositories.py`
- Always use typed responses: `response={200: Schema, 404: ErrorSchema}`
- Always document with docstrings (shown in Swagger)
- Use `auth=django_auth` or custom auth on every protected endpoint

---

## Code Style

### General rules

- Line length: **120 characters**
- Style guide: **PEP-8 strictly enforced**
- Formatter: **Ruff (Black-compatible)**
- Import order: **isort-compatible** (via Ruff)
- All functions, classes and methods must have **type annotations**
- All public functions and classes must have **Google-style docstrings**
- Prefer `|` union syntax over `Optional[X]` (Python 3.10+)
- Use `from __future__ import annotations` if needed for forward refs

### Docstring format (Google style)

```python
async def create_user(email: str, full_name: str) -> User:
    """Create a new user in the database.

    Args:
        email: The user's email address.
        full_name: The user's full name.

    Returns:
        The newly created User instance.

    Raises:
        UserAlreadyExistsError: If a user with this email already exists.
    """
```

### Type annotations

```python
# ✅ Correct
async def get_users(is_active: bool = True) -> list[User]: ...
async def find_by_email(email: str) -> User | None: ...

# ❌ Wrong
async def get_users(is_active=True): ...
async def find_by_email(email): ...
```

---

## Logging with Loguru

Always use Loguru. Never use `print()` for debugging or monitoring.

```python
from loguru import logger

# Contextual logging
logger.info("User created", user_id=user.id, email=user.email)
logger.warning("Rate limit approaching", user_id=user_id, requests=count)
logger.error("External API failed", url=url, status_code=response.status_code)
logger.exception("Unexpected error")  # includes full traceback

# In services — bind context for the whole function
with logger.contextualize(user_id=user_id, request_id=request_id):
    logger.info("Processing request")
    result = await some_operation()
    logger.info("Request completed")
```

### Loguru setup (core/logging.py)

```python
import sys
from loguru import logger


def setup_logging(level: str = "INFO") -> None:
    """Configure Loguru for the application."""
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        level=level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        serialize=True,  # JSON in production
    )
```

---

## Ruff Configuration (pyproject.toml)

```toml
[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "B",    # flake8-bugbear
    "C4",   # flake8-comprehensions
    "UP",   # pyupgrade
    "N",    # pep8-naming
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
    "ANN",  # flake8-annotations (typing enforcement)
    "ASYNC",# flake8-async (async-specific rules)
    "S",    # flake8-bandit (security)
    "DJ",   # flake8-django
    "PT",   # flake8-pytest-style
    "RUF",  # Ruff-specific rules
]
ignore = [
    "S101",    # Use of assert (OK in tests)
    "S104",    # Binding to all interfaces (needed for Docker)
]

[tool.ruff.lint.per-file-ignores]
"*/tests/*" = ["ANN", "S"]
"*/migrations/*" = ["ALL"]
"manage.py" = ["ANN"]

[tool.ruff.lint.isort]
known-first-party = ["apps", "core", "config"]
force-sort-within-sections = true

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
line-ending = "lf"
```

---

## Pre-commit Configuration (.pre-commit-config.yaml)

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: ["--maxkb=500"]
      - id: debug-statements
      - id: mixed-line-ending
        args: ["--fix=lf"]

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: ["--fix"]
      - id: ruff-format

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ["--baseline", ".secrets.baseline"]
        exclude: "package.lock.json"

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.8
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]
        additional_dependencies: ["bandit[toml]"]
```

---

## Bandit Configuration (pyproject.toml)

```toml
[tool.bandit]
exclude_dirs = ["tests", "migrations"]
skips = ["B101"]  # assert in tests is fine
```

---

## Testing

- Use `pytest` with `pytest-django` and `pytest-asyncio`
- All test functions that test async code must be `async def` with `@pytest.mark.asyncio`
- Use `factory_boy` for fixtures
- Use `respx` to mock external HTTP calls (httpx)
- Coverage target: **≥ 80%**

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(async_client: AsyncClient) -> None:
    """Test user creation endpoint."""
    response = await async_client.post(
        "/api/users/",
        json={"email": "test@example.com", "full_name": "Test User"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
```

---

## Settings Files

There are **3 settings files** + 1 base. Never run Django with `base.py` directly.

```
config/settings/
├── base.py          # Shared config inherited by all envs (no secrets, no DEBUG)
├── local.py         # ← your personal machine (git-ignored via .gitignore)
├── development.py   # ← shared dev server (DEBUG=True, committed to git)
└── production.py    # ← Render.com (DEBUG=False, committed to git)
```

### Which file to use

| Context | `DJANGO_SETTINGS_MODULE` |
|---|---|
| Your local machine | `config.settings.local` |
| Shared dev / CI | `config.settings.development` |
| Render.com | `config.settings.production` |

### base.py — never contains secrets or DEBUG

```python
# config/settings/base.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "ninja",
    # project apps
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",   # must be before CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
# ... shared TEMPLATES, AUTH, etc.
```

### local.py — personal overrides, NEVER committed

```python
# config/settings/local.py
from .development import *  # noqa: F403

# Override anything you need only on your machine
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "myproject_local",
        "USER": "postgres",
        "PASSWORD": "postgres",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# Optional: personal API keys for local testing
# SOME_API_KEY = "..."
```

### development.py — DEBUG=True, committed to git

```python
# config/settings/development.py
from .base import *  # noqa: F403
import os

DEBUG = True
ALLOWED_HOSTS = ["*"]

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-dev-key-change-in-prod")

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
    }
}

# Dev-only apps
INSTALLED_APPS += ["django_extensions"]  # noqa: F405

# CORS — allow Vite dev server (not needed locally due to proxy, but needed if running Django standalone)
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
CORS_ALLOW_CREDENTIALS = True
```

### production.py — strict, for Render.com

```python
# config/settings/production.py
from .base import *  # noqa: F403
import os

DEBUG = False

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ["DATABASE_URL"],
        conn_max_age=600,
        conn_health_checks=True,
    )
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ["REDIS_URL"],
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# CORS — allow frontend origin (set CORS_ALLOWED_ORIGINS in Render dashboard)
CORS_ALLOWED_ORIGINS = os.environ["CORS_ALLOWED_ORIGINS"].split(",")
CORS_ALLOW_CREDENTIALS = True

# Security settings for HTTPS on Render
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```

### .gitignore entries required

```
config/settings/local.py
.env
.env.local
```

---

## Docker Compose — Local Development

All compose files live in `docker/`. Each file maps to a settings file.
The goal is to spin up **only the infrastructure** (DB + Redis), not the app itself —
so you can run Django with `uv run python manage.py runserver` normally.

### Commands

```bash
# Local: just PostgreSQL + Redis (use with local.py or development.py)
docker compose -f docker/local.yml up -d

# Development: infra + app container with hot-reload
docker compose -f docker/development.yml up

# Production mirror: full stack for smoke tests before deploying
docker compose -f docker/production.yml up --build

# Stop any environment
docker compose -f docker/<file>.yml down

# Stop and remove volumes (wipe DB)
docker compose -f docker/<file>.yml down -v
```

### docker/local.yml — infra only, no app container

```yaml
# docker/local.yml
# Use with: DJANGO_SETTINGS_MODULE=config.settings.local
# Starts only PostgreSQL and Redis. Run Django manually with uv.

services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: plur_local
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_local_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_local_data:/data

volumes:
  postgres_local_data:
  redis_local_data:
```

### docker/development.yml — infra + app with hot-reload

```yaml
# docker/development.yml
# Use with: DJANGO_SETTINGS_MODULE=config.settings.development
# Starts PostgreSQL, Redis, and the Django app with code mounted for hot-reload.

services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: plur_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

  app:
    build:
      context: ..
      dockerfile: Dockerfile
    command: uv run python manage.py runserver 0.0.0.0:8000
    volumes:
      - ..:/app                         # Mount source for hot-reload
    ports:
      - "8000:8000"
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.development
      DJANGO_SECRET_KEY: insecure-dev-key-change-in-prod
      POSTGRES_HOST: db
      POSTGRES_DB: plur_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_dev_data:
  redis_dev_data:
```

### docker/production.yml — full stack, mirrors Render

```yaml
# docker/production.yml
# Use with: DJANGO_SETTINGS_MODULE=config.settings.production
# Mirrors the Render.com setup for local smoke tests before deploying.
# Requires a .env.production file (git-ignored) with real secrets.

services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_prod_data:/data

  app:
    build:
      context: ..
      dockerfile: Dockerfile
    command: >
      sh -c "uv run python manage.py migrate --noinput &&
             uv run gunicorn config.asgi:application
             -k uvicorn.workers.UvicornWorker
             --workers 2
             --bind 0.0.0.0:8000"
    ports:
      - "8000:8000"
    env_file:
      - ../.env.production              # git-ignored, contains real secrets
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_prod_data:
  redis_prod_data:
```

---

## Environment Variables

Never hardcode secrets. Always read from environment:

```python
# config/settings/base.py
import os
from pathlib import Path

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DATABASE_URL = os.environ["DATABASE_URL"]
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost").split(",")
```

Required env vars for production (set in Render.com dashboard):
- `DJANGO_SECRET_KEY`
- `DATABASE_URL` (auto-provided by Render PostgreSQL)
- `REDIS_URL` (auto-provided by Render Redis)
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS` (comma-separated list, e.g. `https://plur.vercel.app`)
- `DJANGO_SETTINGS_MODULE=config.settings.production`
- `PYTHON_VERSION=3.11.12`

---

## Render.com Deployment

Key files needed:
- `render.yaml` — infrastructure as code
- `Procfile` or `render.yaml` start command: `gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker`

ASGI server: **Uvicorn** (required for async Django). Never use WSGI in production.

```yaml
# render.yaml (example)
services:
  - type: web
    name: plur-api
    runtime: python
    buildCommand: "uv sync --frozen"
    startCommand: "uv run gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:$PORT"
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: config.settings.production
      - key: PYTHON_VERSION
        value: 3.11.12
```

---

## Security Checklist

- [ ] `DEBUG=False` in production (enforce via env var)
- [ ] `SECRET_KEY` from environment, never in code
- [ ] `ALLOWED_HOSTS` explicitly set
- [ ] HTTPS enforced (`SECURE_SSL_REDIRECT=True` on Render)
- [ ] `SECURE_HSTS_SECONDS` configured
- [ ] `SESSION_COOKIE_SECURE=True`
- [ ] `CSRF_COOKIE_SECURE=True`
- [ ] Database credentials only via `DATABASE_URL`
- [ ] No secrets in `.env` files committed to git
- [ ] `.secrets.baseline` committed and kept updated
- [ ] Bandit passes with no high-severity issues
- [ ] `python manage.py check --deploy` passes clean

---

## Key Dependencies (pyproject.toml reference)

```toml
[project]
requires-python = ">=3.11.12"
dependencies = [
    "django>=5.2",
    "django-ninja>=1.6.2",
    "psycopg>=3.1",               # PostgreSQL async driver (psycopg3, async built-in)
    "redis[hiredis]>=5.0",
    "django-redis>=5.4",
    "httpx>=0.27",                # Async HTTP client
    "loguru>=0.7",
    "gunicorn>=22.0",
    "uvicorn[standard]>=0.30",
    "python-decouple>=3.8",       # Env var management
    "dj-database-url>=2.0",       # DATABASE_URL parsing (used in production.py)
    "django-cors-headers>=4.3",   # CORS support for frontend origin
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-django>=4.8",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5.0",
    "factory-boy>=3.3",
    "respx>=0.21",                # Mock httpx
    "django-extensions>=3.2",
    "pre-commit>=3.7",
    "ruff>=0.4",
    "bandit[toml]>=1.7",
    "detect-secrets>=1.5",
]
```

---

## What NOT to do

- ❌ Never use `print()` — use `logger`
- ❌ Never use `requests` — use `httpx` with `AsyncClient`
- ❌ Never use sync ORM methods in async views (`.get()`, `.filter()`, `.save()`)
- ❌ Never commit secrets or API keys
- ❌ Never put business logic in endpoints — goes in `services.py`
- ❌ Never skip type annotations in non-test code
- ❌ Never use `Optional[X]` — use `X | None` instead
- ❌ Never hardcode `DEBUG=True` — always from env
- ❌ Never use WSGI server in production — always Uvicorn
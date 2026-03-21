"""Root pytest configuration and fixtures."""

from __future__ import annotations

import django
from django.conf import settings
import pytest


@pytest.fixture(autouse=True)
def setup_django() -> None:
    """Ensure Django is set up before tests run."""
    if not settings.configured:
        django.setup()

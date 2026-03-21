"""Sales app configuration."""

from __future__ import annotations

from django.apps import AppConfig


class SalesConfig(AppConfig):
    """Configuration for the sales application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sales"
    verbose_name = "Sales"

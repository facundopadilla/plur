from django.apps import AppConfig


class EarlyAccessConfig(AppConfig):
    """Configuration for the early access application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.early_access"
    verbose_name = "Early Access"

"""Admin registration for sales models."""

from __future__ import annotations

from django.contrib import admin

from apps.sales.models import CreditTransaction, Garment, Sale

admin.site.register(Garment)
admin.site.register(Sale)
admin.site.register(CreditTransaction)

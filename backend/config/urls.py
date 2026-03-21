"""URL configuration for the Plur project."""

from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from apps.match.api.endpoints import router as match_router  # — registers endpoints
from apps.sales.api.endpoints import router as sales_router  # — registers endpoints
from apps.users.api.endpoints import router as auth_router  # — registers endpoints

api = NinjaAPI(title="Plur API", version="0.1.0", description="Plur backend API")

api.add_router("/auth", auth_router)
api.add_router("/match", match_router)
api.add_router("/sales", sales_router)


@api.get("/health", tags=["health"], summary="Health check")
async def health_check(request: object) -> dict[str, str]:
    """Return API health status."""
    return {"status": "ok"}


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

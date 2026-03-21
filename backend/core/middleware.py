"""Custom middleware for the Plur project."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING
import uuid

from loguru import logger

if TYPE_CHECKING:
    from collections.abc import Callable

    from django.http import HttpRequest, HttpResponse


class RequestLoggingMiddleware:
    """Middleware that logs each request with timing and a unique request ID."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize middleware.

        Args:
            get_response: The next middleware or view callable.
        """
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request, log it, and return the response.

        Args:
            request: The incoming HTTP request.

        Returns:
            The HTTP response from the next handler.
        """
        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        with logger.contextualize(request_id=request_id):
            logger.info(
                "Request started",
                method=request.method,
                path=request.path,
            )

            response = self.get_response(request)

            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.info(
                "Request completed",
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
            )

        return response

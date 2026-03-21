"""Loguru logging setup for the Plur project."""

from __future__ import annotations

import sys

from loguru import logger


def setup_logging(level: str = "INFO") -> None:
    """Configure Loguru for the application.

    Args:
        level: The minimum log level to capture.
    """
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        level=level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        serialize=False,
    )

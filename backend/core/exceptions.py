"""Global exception classes and Django Ninja exception handlers."""

from __future__ import annotations


class PlurError(Exception):
    """Base exception for all Plur application errors."""

    def __init__(self, message: str, code: str = "error") -> None:
        """Initialize the exception.

        Args:
            message: Human-readable error description.
            code: Machine-readable error code.
        """
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(PlurError):
    """Raised when a requested resource does not exist."""

    def __init__(self, message: str = "Resource not found") -> None:
        """Initialize the not found error.

        Args:
            message: Human-readable error description.
        """
        super().__init__(message=message, code="not_found")


class ValidationError(PlurError):
    """Raised when input data fails validation."""

    def __init__(self, message: str = "Validation error") -> None:
        """Initialize the validation error.

        Args:
            message: Human-readable error description.
        """
        super().__init__(message=message, code="validation_error")

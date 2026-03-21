"""User model definitions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

if TYPE_CHECKING:
    pass


class UserManager(BaseUserManager["User"]):
    """Custom user manager using email as the username field."""

    def create_user(
        self,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
        date_of_birth: str = "1990-01-01",
        phone_number: str = "",
        **extra_fields: object,
    ) -> "User":
        """Create and save a regular user.

        Args:
            email: The user's email address (used as username).
            password: The user's plain-text password (will be hashed).
            first_name: The user's first name.
            last_name: The user's last name.
            date_of_birth: The user's date of birth as ISO 8601 string.
            phone_number: The user's phone number.
            **extra_fields: Additional fields to set on the user.

        Returns:
            The newly created User instance.
        """
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            phone_number=phone_number,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields: object) -> "User":
        """Create and save a superuser.

        Args:
            email: The superuser's email address.
            password: The superuser's plain-text password.
            **extra_fields: Additional fields to set on the user.

        Returns:
            The newly created superuser instance.
        """
        extra_fields.setdefault("is_staff", True)  # type: ignore[attr-defined]
        extra_fields.setdefault("is_superuser", True)  # type: ignore[attr-defined]
        extra_fields.setdefault("is_active", True)  # type: ignore[attr-defined]
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the unique identifier.

    Fields:
        email: Unique email address — used as the username.
        first_name: The user's first name.
        last_name: The user's last name.
        date_of_birth: The user's date of birth.
        phone_number: The user's phone number (with country code).
        profile_picture: Optional profile picture.
        is_active: Whether the account is activated via email code.
        is_staff: Whether the user can access the Django admin.
        date_joined: Timestamp when the account was created.
        activation_code: 6-digit code for email activation.
        reset_code: 6-digit code for password reset.
    """

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    phone_number = models.CharField(max_length=30)
    profile_picture = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    activation_code = models.CharField(max_length=6, blank=True)
    reset_code = models.CharField(max_length=6, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "date_of_birth", "phone_number"]

    objects: UserManager = UserManager()

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        """Return string representation of the user."""
        return self.email

    @property
    def full_name(self) -> str:
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}"

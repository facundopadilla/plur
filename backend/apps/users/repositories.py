"""Database access layer for the users app."""

from __future__ import annotations

from eth_account import Account

from apps.users.models import User, UserPreferences


class UserRepository:
    """Repository for User database operations."""

    @staticmethod
    async def get_by_email(email: str) -> User | None:
        """Get a user by email address.

        Args:
            email: The email address to look up.

        Returns:
            The User instance or None if not found.
        """
        try:
            return await User.objects.aget(email=email)
        except User.DoesNotExist:
            return None

    @staticmethod
    async def email_exists(email: str) -> bool:
        """Check whether an email address is already registered.

        Args:
            email: The email address to check.

        Returns:
            True if the email is registered, False otherwise.
        """
        return await User.objects.filter(email=email).aexists()

    @staticmethod
    async def create_user(
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        phone_number: str,
        activation_code: str,
    ) -> User:
        """Create and persist a new inactive user.

        Args:
            email: The user's email address.
            password: The plain-text password (will be hashed).
            first_name: The user's first name.
            last_name: The user's last name.
            date_of_birth: ISO 8601 date string (YYYY-MM-DD).
            phone_number: The user's phone number.
            activation_code: 6-digit activation code.

        Returns:
            The newly created User instance.
        """
        acct = Account.create()
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            phone_number=phone_number,
            activation_code=activation_code,
            is_active=False,
            wallet_address=acct.address,
            wallet_private_key=acct.key.hex(),
        )
        user.set_password(password)
        await user.asave()
        return user


class PreferencesRepository:
    """Repository for UserPreferences database operations."""

    @staticmethod
    async def get_or_create(user: User) -> UserPreferences:
        """Get or create preferences for a user (with defaults).

        Args:
            user: The User instance.

        Returns:
            The UserPreferences instance (existing or newly created).
        """
        prefs, _ = await UserPreferences.objects.aget_or_create(user=user)
        return prefs

    @staticmethod
    async def update(user: User, data: dict) -> UserPreferences:
        """Update preferences for a user.

        Args:
            user: The User instance.
            data: Dictionary of fields to update (partial).

        Returns:
            The updated UserPreferences instance.
        """
        prefs = await PreferencesRepository.get_or_create(user)
        for key, value in data.items():
            if value is not None:
                setattr(prefs, key, value)
        await prefs.asave()
        return prefs

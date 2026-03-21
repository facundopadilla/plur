from ninja import Schema


class SignupOut(Schema):
    """Output schema for early access signup."""

    message: str
    items_count: int


class ErrorOut(Schema):
    """Error response schema."""

    detail: str

from datetime import datetime, timezone

def utc_now() -> datetime:
    """Returns current naive UTC datetime (for consistent DB DateTime storage) without deprecation warnings."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

import re

PATTERNS = (r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b", r"\b(?:\+48\s*)?\d(?:[\s-]?\d){8}\b", r"\b\d{2}-\d{3}\b")
def sanitize(text: str) -> str:
    """Remove direct identifiers before a request leaves the machine."""
    value = text
    for pattern in PATTERNS: value = re.sub(pattern, "[USUNIĘTO]", value)
    return re.sub(r"\s+", " ", value).strip()

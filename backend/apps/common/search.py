"""Small, dependency-free helpers for multilingual catalogue search."""

import re
from collections.abc import Iterable

CYRILLIC_TO_LATIN = str.maketrans(
    {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "e",
        "ж": "zh",
        "з": "z",
        "и": "i",
        "й": "y",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "kh",
        "ц": "ts",
        "ч": "ch",
        "ш": "sh",
        "щ": "shch",
        "ъ": "",
        "ы": "y",
        "ь": "",
        "э": "e",
        "ю": "yu",
        "я": "ya",
    }
)


def transliterate(value: str) -> str:
    return value.lower().translate(CYRILLIC_TO_LATIN)


def search_text(parts: Iterable[str]) -> str:
    """Keep whitespace stable so PostgreSQL can tokenize consistently."""
    return re.sub(r"\s+", " ", " ".join(part for part in parts if part)).strip()


def search_terms(value: str) -> list[str]:
    """Return meaningful Unicode terms for multi-field catalogue matching."""
    return re.findall(r"[\w-]+", value.lower(), flags=re.UNICODE)

import re
from typing import Any

STOP_WORDS = {
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in',
    'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 'will',
    'with', 'you', 'your', 'we', 'our', 'they', 'them', 'their', 'this', 'that', 'job',
    'work', 'company', 'apply', 'hiring', 'candidate', 'candidates', 'role', 'opportunity'
}

TEXT_COLUMNS = [
    'job_title', 'title', 'company_profile', 'description', 'requirements', 'benefits',
    'location', 'employment_type', 'education', 'industry', 'function', 'salary_range'
]


def normalize_whitespace(text: str) -> str:
    return re.sub(r'\s+', ' ', text or '').strip()


def to_text(value: Any) -> str:
    if value is None:
        return ''
    return str(value)


def clean_text(text: str) -> str:
    text = to_text(text).lower()
    text = text.replace('\\n', ' ')
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def tokenize_and_remove_stopwords(text: str) -> str:
    cleaned = clean_text(text)
    tokens = [token for token in cleaned.split() if token not in STOP_WORDS and len(token) > 1]
    return ' '.join(tokens)


def combine_text_fields(data: dict) -> str:
    parts = []
    for column in TEXT_COLUMNS:
        if column == 'job_title' and column not in data and 'title' in data:
            value = data.get('title', '')
        else:
            value = data.get(column, '')
        parts.append(to_text(value))
    return ' '.join(parts)


def preprocess_text(text: str) -> str:
    if text is None:
        return ''
    text = clean_text(text)
    text = tokenize_and_remove_stopwords(text)
    return normalize_whitespace(text)

import re
from typing import Any, Dict

from config import SALARY_THRESHOLDS


def extract_salary_value(text: str) -> float:
    if not text:
        return 0.0

    value_matches = re.findall(r'(?:rs|inr|₹|\$|£)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)', text.lower())
    if not value_matches:
        return 0.0

    cleaned = [float(value.replace(',', '')) for value in value_matches]
    return max(cleaned) if cleaned else 0.0


def analyze_salary(text: str, salary_range: str = '') -> Dict[str, Any]:
    combined = f"{text or ''} {salary_range or ''}".strip()
    salary_value = extract_salary_value(combined)
    salary_detected = salary_value > 0

    if not salary_detected:
        return {
            'salary_detected': False,
            'salary_value': None,
            'salary_flag': False,
            'message': 'No salary information detected',
        }

    if 'month' in combined.lower() and salary_value > SALARY_THRESHOLDS['monthly_max']:
        salary_flag = True
        message = 'Salary appears unrealistic for the stated employment context.'
    elif 'day' in combined.lower() and salary_value > SALARY_THRESHOLDS['daily_max']:
        salary_flag = True
        message = 'Daily salary exceeds the configured safety threshold.'
    elif 'hour' in combined.lower() and salary_value > SALARY_THRESHOLDS['hourly_max']:
        salary_flag = True
        message = 'Hourly pay exceeds the configured safety threshold.'
    else:
        salary_flag = False
        message = 'Salary appears within a plausible range.'

    return {
        'salary_detected': True,
        'salary_value': round(salary_value, 2),
        'salary_flag': salary_flag,
        'message': message,
    }

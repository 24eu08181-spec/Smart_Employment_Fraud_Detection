from typing import Any, Dict, List


def clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def indicator_weight(message: str) -> int:
    normalized = message.lower()
    if 'payment' in normalized or 'deposit' in normalized or 'bank details' in normalized:
        return 18
    if 'guaranteed' in normalized or 'easy money' in normalized or 'quick cash' in normalized:
        return 16
    if 'urgent' in normalized or 'limited seats' in normalized or 'act immediately' in normalized:
        return 12
    if 'whatsapp' in normalized or 'telegram' in normalized or 'personal email' in normalized:
        return 10
    if 'no interview' in normalized:
        return 8
    return 6


def calculate_risk_score(ml_confidence: float, ml_prediction: str, fraud_indicators: List[Any], verification_results: Dict[str, Any], salary_results: Dict[str, Any] | None = None):
    confidence = float(ml_confidence or 0.0)
    prediction = (ml_prediction or 'Genuine').capitalize()
    if prediction == 'Fraudulent':
        prediction = 'Fake'
    if prediction == 'Fake':
        score = 55 + (confidence * 35)
    elif prediction == 'Genuine':
        score = max(0, (1 - confidence) * 25)
    else:
        score = 20

    for item in fraud_indicators or []:
        if isinstance(item, dict):
            message = item.get('message', '')
        else:
            message = str(item)
        score += indicator_weight(str(message))

    if verification_results:
        status = verification_results.get('verification_status', 'Not Verified')
        if status == 'Not Verified':
            score += 8
        elif status == 'Partial':
            score += 4

    if salary_results and salary_results.get('salary_flag'):
        score += 15

    score = int(clamp(score))

    if score <= 30:
        risk_level = 'Low Risk'
        final_category = 'Genuine'
    elif score <= 60:
        risk_level = 'Medium Risk'
        final_category = 'Suspicious'
    else:
        risk_level = 'High Risk'
        final_category = 'Fake'

    return {
        'risk_score': score,
        'risk_level': risk_level,
        'final_category': final_category,
        'fraud_indicators': [
            item.get('message', str(item)) if isinstance(item, dict) else str(item)
            for item in (fraud_indicators or [])
        ],
    }

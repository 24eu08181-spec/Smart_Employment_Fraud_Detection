import re
from typing import List, Dict, Any

PATTERN_RULES = [
    {
        'type': 'payment_request',
        'message': 'Payment request detected',
        'severity': 'high',
        'patterns': [
            'payment required', 'registration fee', 'processing fee', 'security deposit',
            'pay money', 'send money', 'pay upfront', 'bank details', 'otp request',
            'deposit required', 'membership fee', 'refund fee'
        ],
    },
    {
        'type': 'urgent_hiring',
        'message': 'Urgent hiring wording detected',
        'severity': 'medium',
        'patterns': [
            'act immediately', 'urgent hiring', 'limited seats', 'hiring now', 'apply fast',
            'immediate join', 'today only', 'very urgent'
        ],
    },
    {
        'type': 'easy_money',
        'message': 'Guaranteed or easy money wording detected',
        'severity': 'high',
        'patterns': [
            'guaranteed job', 'easy money', 'quick cash', 'unlimited income', 'work from home',
            'no experience required', 'earn without investment'
        ],
    },
    {
        'type': 'whatsapp_only',
        'message': 'WhatsApp-only recruitment detected',
        'severity': 'medium',
        'patterns': ['whatsapp only', 'telegram only', 'contact via whatsapp', 'contact via telegram'],
    },
    {
        'type': 'personal_email',
        'message': 'Personal email used instead of company email',
        'severity': 'medium',
        'patterns': ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'],
    },
    {
        'type': 'no_interview',
        'message': 'No interview stage mentioned',
        'severity': 'medium',
        'patterns': ['no interview', 'interview not required', 'no screening', 'instant selection'],
    },
]


def detect_fraud_indicators(text: str, recruiter_email: str = '', company_website: str = '') -> List[Dict[str, Any]]:
    normalized = (text or '').lower()
    matches: List[Dict[str, Any]] = []

    for rule in PATTERN_RULES:
        for pattern in rule['patterns']:
            if pattern in normalized:
                matches.append({
                    'type': rule['type'],
                    'message': rule['message'],
                    'severity': rule['severity'],
                })
                break

    if recruiter_email and re.search(r'@(gmail|yahoo|hotmail|outlook|icloud)\.com', recruiter_email.lower()):
        matches.append({
            'type': 'personal_email',
            'message': 'Personal email detected',
            'severity': 'medium',
        })

    if company_website and 'http' not in company_website.lower():
        matches.append({
            'type': 'website_missing',
            'message': 'Company website is missing or incomplete',
            'severity': 'low',
        })

    return matches

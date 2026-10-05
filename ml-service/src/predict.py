import json
from pathlib import Path
from typing import Any, Dict, List

import joblib

from config import MODEL_DIR, MODEL_METADATA_PATH, MODEL_PATH, VECTORIZER_PATH
from fraud_indicators import detect_fraud_indicators
from preprocessing import combine_text_fields, preprocess_text
from risk_engine import calculate_risk_score
from salary_analysis import analyze_salary
from verification import verify_company_context


def load_artifacts():
    if not VECTORIZER_PATH.exists() or not MODEL_PATH.exists():
        raise FileNotFoundError('ML model is not trained. Please train the model first.')

    vectorizer = joblib.load(VECTORIZER_PATH)
    model = joblib.load(MODEL_PATH)
    metadata = {}
    if MODEL_METADATA_PATH.exists():
        with open(MODEL_METADATA_PATH, 'r', encoding='utf-8') as file:
            metadata = json.load(file)
    return vectorizer, model, metadata


def predict_single_ad(ad_payload: Dict[str, Any]) -> Dict[str, Any]:
    vectorizer, model, metadata = load_artifacts()

    payload = ad_payload or {}
    combined = combine_text_fields({
        'job_title': payload.get('job_title', payload.get('jobTitle', '')),
        'company_profile': payload.get('company_profile', payload.get('companyProfile', '')),
        'description': payload.get('description', ''),
        'requirements': payload.get('requirements', ''),
        'benefits': payload.get('benefits', ''),
        'location': payload.get('location', ''),
        'employment_type': payload.get('employment_type', payload.get('employmentType', '')),
        'education': payload.get('education', ''),
        'industry': payload.get('industry', ''),
        'function': payload.get('function', ''),
        'salary_range': payload.get('salary_range', payload.get('salaryRange', '')),
    })

    cleaned_text = preprocess_text(combined)
    transformed = vectorizer.transform([cleaned_text])

    prediction_index = int(model.predict(transformed)[0])
    model_label = 'Fake' if prediction_index == 1 else 'Genuine'
    ml_class = 'Fraudulent' if model_label == 'Fake' else 'Genuine'

    if hasattr(model, 'predict_proba'):
        probability_values = model.predict_proba(transformed)[0]
        confidence = float(max(probability_values))
    else:
        confidence = 0.5

    company_name = payload.get('company_name', payload.get('companyName', ''))
    company_website = payload.get('company_website', payload.get('companyWebsite', ''))
    recruiter_email = payload.get('recruiter_email', payload.get('recruiterEmail', ''))
    job_source_url = payload.get('job_source_url', payload.get('jobSourceUrl', ''))

    indicator_matches = detect_fraud_indicators(combined, recruiter_email, company_website)
    salary_info = analyze_salary(combined, payload.get('salary_range', payload.get('salaryRange', '')))
    verification = verify_company_context(company_name, company_website, recruiter_email, job_source_url)

    risk = calculate_risk_score(
        ml_confidence=confidence,
        ml_prediction=model_label,
        fraud_indicators=indicator_matches,
        verification_results=verification,
        salary_results=salary_info,
    )

    final_prediction = risk['final_category']
    return {
        'prediction': final_prediction,
        'ml_prediction': model_label,
        'ml_class': ml_class,
        'confidence': round(confidence, 4),
        'risk_score': risk['risk_score'],
        'risk_level': risk['risk_level'],
        'fraud_indicators': risk['fraud_indicators'],
        'indicator_details': indicator_matches,
        'verification': verification,
        'salary_analysis': salary_info,
        'model_metadata': metadata,
    }


def predict_batch(payload: Dict[str, Any]) -> Dict[str, Any]:
    jobs = payload.get('jobs', []) if isinstance(payload, dict) else []
    results = [predict_single_ad(job) for job in jobs]
    return {'results': results}

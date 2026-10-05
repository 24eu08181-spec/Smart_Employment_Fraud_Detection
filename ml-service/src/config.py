from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = BASE_DIR / 'data' / 'emscad.csv'
MODEL_DIR = BASE_DIR / 'models'
VECTORIZER_PATH = MODEL_DIR / 'tfidf_vectorizer.joblib'
MODEL_PATH = MODEL_DIR / 'svm_model.joblib'
MODEL_METADATA_PATH = MODEL_DIR / 'model_metadata.json'

SUSPICIOUS_KEYWORDS = [
    'urgent hiring', 'hiring now', 'easy money', 'guaranteed job', 'no interview',
    'work from home', 'limited seats', 'act immediately', 'send money', 'pay money',
    'registration fee', 'processing fee', 'security deposit', 'bank details', 'otp request',
    'whatsapp only', 'telegram only', 'pay upfront', 'quick cash', 'unlimited income'
]

SALARY_THRESHOLDS = {
    'monthly_min': 1000,
    'monthly_max': 250000,
    'daily_max': 20000,
    'hourly_max': 2000,
}

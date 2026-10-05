import json
import os
from pathlib import Path

import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVC
import joblib

from config import BASE_DIR, DATASET_PATH, MODEL_DIR, MODEL_METADATA_PATH, MODEL_PATH, VECTORIZER_PATH
from preprocessing import combine_text_fields, preprocess_text


LABEL_MAPPING = {0: 'Genuine', 1: 'Fake'}


def _coerce_dataset_fields(df: pd.DataFrame) -> pd.DataFrame:
    if 'job_title' not in df.columns and 'title' in df.columns:
        df['job_title'] = df['title']

    required = ['job_title', 'company_profile', 'description', 'requirements', 'benefits', 'location', 'employment_type', 'education', 'industry', 'function', 'fraudulent']
    for field in required:
        if field not in df.columns:
            df[field] = ''

    df = df.fillna('')
    df['fraudulent'] = df['fraudulent'].astype(str).str.strip().str.lower().map({
        '0': 0,
        '1': 1,
        'f': 0,
        'false': 0,
        't': 1,
        'true': 1,
        'genuine': 0,
        'fake': 1,
        'fraudulent': 1,
        'legit': 0,
        'legitimate': 0,
    })
    df['fraudulent'] = pd.to_numeric(df['fraudulent'], errors='coerce').fillna(0).astype(int)
    df = df.drop_duplicates()
    return df


def train_model(dataset_path: str | Path = DATASET_PATH):
    dataset_path = Path(dataset_path)
    if not dataset_path.exists():
        raise FileNotFoundError('EMSCAD dataset not found.')

    if not MODEL_DIR.exists():
        MODEL_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(dataset_path)
    df = _coerce_dataset_fields(df)

    def combined_text(row):
        payload = {
            'job_title': row.get('job_title', row.get('title', '')),
            'company_profile': row.get('company_profile', ''),
            'description': row.get('description', ''),
            'requirements': row.get('requirements', ''),
            'benefits': row.get('benefits', ''),
            'location': row.get('location', ''),
            'employment_type': row.get('employment_type', ''),
            'education': row.get('education', ''),
            'industry': row.get('industry', ''),
            'function': row.get('function', ''),
                'salary_range': row.get('salary_range', ''),
        }
        return preprocess_text(combine_text_fields(payload))

    df['combined_text'] = df.apply(combined_text, axis=1)
    df = df[df['combined_text'].str.len() > 0].copy()

    X = df['combined_text']
    y = df['fraudulent'].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=2,
        max_features=5000,
        strip_accents='unicode',
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    svm_model = LinearSVC(C=1.0, class_weight='balanced')
    calibrated_model = CalibratedClassifierCV(estimator=svm_model, cv=3)
    calibrated_model.fit(X_train_tfidf, y_train)

    predictions = calibrated_model.predict(X_test_tfidf)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, average='binary', zero_division=0)
    recall = recall_score(y_test, predictions, average='binary', zero_division=0)
    f1 = f1_score(y_test, predictions, average='binary', zero_division=0)
    cm = confusion_matrix(y_test, predictions).tolist()
    report = classification_report(y_test, predictions, labels=[0, 1], output_dict=True, zero_division=0)

    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(calibrated_model, MODEL_PATH)

    metadata = {
        'training_date': pd.Timestamp.now().isoformat(),
        'dataset_size': int(len(df)),
        'training_size': int(len(X_train)),
        'testing_size': int(len(X_test)),
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'model_name': 'Linear SVM',
        'feature_count': int(X_train_tfidf.shape[1]),
        'confusion_matrix': cm,
        'classification_report': report,
    }

    with open(MODEL_METADATA_PATH, 'w', encoding='utf-8') as file:
        json.dump(metadata, file, indent=2)

    return {
        'status': 'success',
        'dataset_size': int(len(df)),
        'training_size': int(len(X_train)),
        'testing_size': int(len(X_test)),
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'model_name': 'Linear SVM',
        'feature_count': int(X_train_tfidf.shape[1]),
        'confusion_matrix': cm,
        'message': 'Model trained successfully.',
    }


if __name__ == '__main__':
    print(train_model())

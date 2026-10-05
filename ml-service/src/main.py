import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from config import MODEL_METADATA_PATH
from predict import predict_batch, predict_single_ad
from train_model import train_model

app = FastAPI(title='Smart Employment Fraud Detection ML Service')


class PredictionRequest(BaseModel):
    job_title: str = ''
    location: str = ''
    salary_range: str = ''
    company_profile: str = ''
    description: str = ''
    requirements: str = ''
    benefits: str = ''
    employment_type: str = ''
    education: str = ''
    industry: str = ''
    function: str = ''
    company_name: str = ''
    company_website: str = ''
    recruiter_email: str = ''
    job_source_url: str = ''


@app.get('/health')
def health_check():
    return {'status': 'ok', 'message': 'ML service is healthy.'}


@app.post('/predict')
def predict(payload: PredictionRequest):
    try:
        result = predict_single_ad(payload.model_dump())
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail='Prediction failed. Please try again.') from exc


@app.post('/train')
def train():
    try:
        result = train_model()
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail='EMSCAD dataset not found.') from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail='Model training failed.') from exc


@app.get('/model-info')
def model_info():
    if not MODEL_METADATA_PATH.exists():
        return {
            'status': 'not trained yet',
            'message': 'Model not trained yet',
            'model_name': 'Linear SVM',
            'feature_extraction': 'TF-IDF',
            'dataset': 'EMSCAD',
        }

    with open(MODEL_METADATA_PATH, 'r', encoding='utf-8') as file:
        metadata = json.load(file)

    return {
        'status': 'trained',
        'model_name': 'Linear SVM',
        'feature_extraction': 'TF-IDF',
        'dataset': 'EMSCAD',
        **metadata,
    }


@app.post('/batch-predict')
def batch_predict(payload: dict):
    try:
        return predict_batch(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail='Batch prediction failed.') from exc


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=False)

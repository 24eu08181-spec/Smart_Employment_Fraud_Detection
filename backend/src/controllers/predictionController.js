import {
  createPrediction,
  createTrainingRun,
  deletePrediction as removePrediction,
  getDashboardStats as readDashboardStats,
  getPrediction,
  listPredictions,
  updateTrainingRun,
} from '../storage/jsonStore.js';
import {
  getModelInfo as getModelMetadata,
  healthCheck,
  predictAdvertisement,
  trainModel,
} from '../services/mlService.js';

function normalizeInput(data = {}) {
  return {
    job_title: data.job_title || data.jobTitle || '',
    company_name: data.company_name || data.companyName || '',
    location: data.location || '',
    salary_range: data.salary_range || data.salaryRange || '',
    company_profile: data.company_profile || data.companyProfile || '',
    description: data.description || '',
    requirements: data.requirements || '',
    benefits: data.benefits || '',
    employment_type: data.employment_type || data.employmentType || '',
    education: data.education || '',
    industry: data.industry || '',
    function: data.function || '',
    company_website: data.company_website || data.companyWebsite || '',
    recruiter_email: data.recruiter_email || data.recruiterEmail || '',
    job_source_url: data.job_source_url || data.jobSourceUrl || '',
  };
}

function sanitizePredictionRecord(payload, result) {
  return {
    jobTitle: payload.job_title || payload.jobTitle || 'Unknown role',
    companyName: payload.company_name || payload.companyName || '',
    location: payload.location || '',
    description: payload.description || '',
    prediction: result.prediction || 'Genuine',
    mlPrediction: result.ml_prediction || result.mlPrediction || 'Genuine',
    confidence: Number(result.confidence || 0),
    riskScore: Number(result.risk_score || result.riskScore || 0),
    riskLevel: result.risk_level || result.riskLevel || 'Low Risk',
    fraudIndicators: Array.isArray(result.fraud_indicators) ? result.fraud_indicators : [],
    verification: result.verification || {},
    inputData: payload,
  };
}

export async function analyzeJob(req, res, next) {
  try {
    const input = normalizeInput(req.body);

    if (!input.job_title || !input.description) {
      return res.status(400).json({
        success: false,
        message: 'Job title and description are required.',
      });
    }

    const result = await predictAdvertisement(input);
    const record = sanitizePredictionRecord(input, result);

    const saved = await createPrediction(record);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        id: saved._id,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPredictions(req, res, next) {
  try {
    const { status, sort = 'createdAt', order = 'desc' } = req.query;
    const predictions = await listPredictions({ status, sort, order });

    res.json({ success: true, data: predictions });
  } catch (error) {
    next(error);
  }
}

export async function getPredictionById(req, res, next) {
  try {
    const prediction = await getPrediction(req.params.id);
    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found.' });
    }

    res.json({ success: true, data: prediction });
  } catch (error) {
    next(error);
  }
}

export async function deletePrediction(req, res, next) {
  try {
    const deleted = await removePrediction(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Prediction not found.' });
    }

    res.json({ success: true, message: 'Prediction deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    res.json({
      success: true,
      data: await readDashboardStats(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getModelInfo(req, res, next) {
  try {
    const modelInfo = await getModelMetadata();
    res.json({ success: true, data: modelInfo });
  } catch (error) {
    res.json({
      success: true,
      data: {
        modelName: 'Linear SVM',
        modelType: 'Linear SVM',
        featureExtraction: 'TF-IDF',
        dataset: 'EMSCAD',
        status: 'not trained yet',
        message: 'Model not trained yet',
      },
    });
  }
}

export async function getHealthCheck(req, res, next) {
  try {
    const result = await healthCheck();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service is currently unavailable.',
    });
  }
}

export async function trainModelController(req, res, next) {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    const tokenFromHeader = req.headers['x-admin-token'];

    if (adminToken && tokenFromHeader !== adminToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const trainingRun = await createTrainingRun({
      startedAt: new Date(),
      status: 'training',
    });

    const result = await trainModel();

    await updateTrainingRun(trainingRun._id, {
      completedAt: new Date(),
      status: 'completed',
      datasetSize: result.dataset_size || result.datasetSize || 0,
      trainingSize: result.training_size || result.trainingSize || 0,
      testingSize: result.testing_size || result.testingSize || 0,
      accuracy: result.accuracy || 0,
      precision: result.precision || 0,
      recall: result.recall || 0,
      f1Score: result.f1_score || result.f1Score || 0,
      modelName: result.model_name || result.modelName || 'Linear SVM',
    });

    res.json({
      success: true,
      data: {
        ...result,
        trainingRunId: trainingRun._id,
      },
    });
  } catch (error) {
    next(error);
  }
}

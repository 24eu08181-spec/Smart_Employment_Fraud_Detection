import express from 'express';
import {
  analyzeJob,
  deletePrediction,
  getDashboardStats,
  getHealthCheck,
  getModelInfo,
  getPredictionById,
  getPredictions,
  trainModelController,
} from '../controllers/predictionController.js';

const router = express.Router();

router.post('/predict', analyzeJob);
router.get('/predictions', getPredictions);
router.get('/predictions/:id', getPredictionById);
router.delete('/predictions/:id', deletePrediction);
router.get('/dashboard/stats', getDashboardStats);
router.get('/model-info', getModelInfo);
router.get('/health', getHealthCheck);
router.post('/train-model', trainModelController);

export default router;

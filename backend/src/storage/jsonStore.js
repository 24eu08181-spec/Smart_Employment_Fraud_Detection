import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const dataPath = fileURLToPath(new URL('../../data/store.json', import.meta.url));
const dataDirectory = path.dirname(dataPath);
const emptyStore = () => ({ predictions: [], trainingRuns: [] });
let writeQueue = Promise.resolve();

async function readStore() {
  try {
    return JSON.parse(await readFile(dataPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return emptyStore();
    throw error;
  }
}

async function updateStore(mutator) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = mutator(store);
    await mkdir(dataDirectory, { recursive: true });
    const temporaryPath = `${dataPath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8');
    await rename(temporaryPath, dataPath);
    return result;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}

async function getStore() {
  await writeQueue;
  return readStore();
}

export function createPrediction(record) {
  const now = new Date().toISOString();
  return updateStore((store) => {
    const prediction = { ...record, _id: randomUUID(), createdAt: now, updatedAt: now };
    store.predictions.push(prediction);
    return prediction;
  });
}

export async function listPredictions({ status, sort = 'createdAt', order = 'desc' } = {}) {
  const store = await getStore();
  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'jobTitle', 'companyName', 'prediction', 'riskScore', 'confidence']);
  const sortField = allowedSortFields.has(sort) ? sort : 'createdAt';
  const direction = order === 'asc' ? 1 : -1;

  return store.predictions
    .filter((item) => !status || status === 'all' || item.prediction === status)
    .sort((left, right) => {
      const leftValue = left[sortField] ?? '';
      const rightValue = right[sortField] ?? '';
      return (leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0) * direction;
    });
}

export async function getPrediction(id) {
  const store = await getStore();
  return store.predictions.find((item) => item._id === id) || null;
}

export function deletePrediction(id) {
  return updateStore((store) => {
    const index = store.predictions.findIndex((item) => item._id === id);
    if (index === -1) return null;
    return store.predictions.splice(index, 1)[0];
  });
}

export async function getDashboardStats() {
  const predictions = await listPredictions();
  const averageRisk = predictions.length
    ? predictions.reduce((total, item) => total + Number(item.riskScore || 0), 0) / predictions.length
    : 0;

  return {
    totalAdsAnalyzed: predictions.length,
    genuine: predictions.filter((item) => item.prediction === 'Genuine').length,
    suspicious: predictions.filter((item) => item.prediction === 'Suspicious').length,
    fake: predictions.filter((item) => item.prediction === 'Fake').length,
    averageRiskScore: Number(averageRisk.toFixed(2)),
    recentPredictions: predictions.slice(0, 6),
  };
}

export function createTrainingRun(data) {
  const now = new Date().toISOString();
  return updateStore((store) => {
    const run = { ...data, _id: randomUUID(), createdAt: now, updatedAt: now };
    store.trainingRuns.push(run);
    return run;
  });
}

export function updateTrainingRun(id, fields) {
  return updateStore((store) => {
    const run = store.trainingRuns.find((item) => item._id === id);
    if (!run) return null;
    Object.assign(run, fields, { updatedAt: new Date().toISOString() });
    return run;
  });
}
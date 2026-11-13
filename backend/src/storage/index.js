import '../config/loadEnv.js';

const store = process.env.DATABASE_URL
  ? await import('./postgresStore.js')
  : await import('./sqliteStore.js');

export const findUserByEmail = (...args) => store.findUserByEmail(...args);
export const createUser = (...args) => store.createUser(...args);
export const findUserById = (...args) => store.findUserById(...args);
export const updateUserProfile = (...args) => store.updateUserProfile(...args);
export const createSession = (...args) => store.createSession(...args);
export const findUserBySession = (...args) => store.findUserBySession(...args);
export const deleteSession = (...args) => store.deleteSession(...args);
export const emailBelongsToAnotherUser = (...args) => store.emailBelongsToAnotherUser(...args);
export const createPrediction = (...args) => store.createPrediction(...args);
export const listPredictions = (...args) => store.listPredictions(...args);
export const getPrediction = (...args) => store.getPrediction(...args);
export const deletePrediction = (...args) => store.deletePrediction(...args);
export const getDashboardStats = (...args) => store.getDashboardStats(...args);
export const createTrainingRun = (...args) => store.createTrainingRun(...args);
export const listTrainingRuns = (...args) => store.listTrainingRuns(...args);
export const updateTrainingRun = (...args) => store.updateTrainingRun(...args);

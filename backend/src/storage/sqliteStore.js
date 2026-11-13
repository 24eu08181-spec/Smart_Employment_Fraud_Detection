import initSqlJs from 'sql.js';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const dataDirectory = fileURLToPath(new URL('../../data/', import.meta.url));
const databasePath = path.join(dataDirectory, 'predictions.sqlite');
const legacyDataPath = path.join(dataDirectory, 'store.json');

mkdirSync(dataDirectory, { recursive: true });

const sqlJsPath = fileURLToPath(import.meta.resolve('sql.js'));
const SQL = await initSqlJs({
  locateFile: (file) => path.join(path.dirname(sqlJsPath), file),
});
const database = new SQL.Database(existsSync(databasePath) ? readFileSync(databasePath) : undefined);
database.run('PRAGMA foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    prediction TEXT,
    job_title TEXT,
    company_name TEXT,
    risk_score REAL,
    confidence REAL,
    data_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS predictions_created_at_idx ON predictions(created_at);
  CREATE TABLE IF NOT EXISTS training_runs (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    updated_at TEXT NOT NULL,
    data_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
`);

const predictionColumns = database.exec('PRAGMA table_info(predictions)')[0].values;
if (!predictionColumns.some((column) => column[1] === 'owner_id')) {
  database.run('ALTER TABLE predictions ADD COLUMN owner_id TEXT');
}
database.run('CREATE INDEX IF NOT EXISTS predictions_owner_created_idx ON predictions(owner_id, created_at)');
const trainingRunColumns = database.exec('PRAGMA table_info(training_runs)')[0].values;
if (!trainingRunColumns.some((column) => column[1] === 'owner_id')) {
  database.run('ALTER TABLE training_runs ADD COLUMN owner_id TEXT');
}
database.run('CREATE INDEX IF NOT EXISTS training_runs_owner_updated_idx ON training_runs(owner_id, updated_at)');

function queryRows(sql, values = []) {
  const statement = database.prepare(sql);
  statement.bind(values);
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

function execute(sql, values = []) {
  const statement = database.prepare(sql);
  statement.bind(values);
  statement.step();
  statement.free();
}

function transaction(operation) {
  database.run('BEGIN TRANSACTION');
  try {
    const result = operation();
    database.run('COMMIT');
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

function persistDatabase() {
  const temporaryPath = `${databasePath}.${randomUUID()}.tmp`;
  const contents = Buffer.from(database.export());
  writeFileSync(temporaryPath, contents);
  try {
    renameSync(temporaryPath, databasePath);
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EEXIST') throw error;
    writeFileSync(databasePath, contents);
    unlinkSync(temporaryPath);
  }
}

function writePrediction(record) {
  const now = new Date().toISOString();
  const prediction = {
    ...record,
    _id: record._id || randomUUID(),
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
  };

  execute(`
  INSERT OR IGNORE INTO predictions
  (id, owner_id, created_at, updated_at, prediction, job_title, company_name, risk_score, confidence, data_json)
  VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
    prediction._id,
  record.ownerId ?? null,
  prediction.createdAt,
    prediction.updatedAt,
    prediction.prediction ?? null,
    prediction.jobTitle ?? null,
    prediction.companyName ?? null,
    prediction.riskScore == null || !Number.isFinite(Number(prediction.riskScore)) ? null : Number(prediction.riskScore),
    prediction.confidence == null || !Number.isFinite(Number(prediction.confidence)) ? null : Number(prediction.confidence),
    JSON.stringify(prediction),
  ]);
  return prediction;
}

function writeTrainingRun(run, ownerId = null) {
  execute(`
  INSERT OR IGNORE INTO training_runs (id, owner_id, updated_at, data_json)
  VALUES (?, ?, ?, ?)
`, [run._id, ownerId, run.updatedAt, JSON.stringify(run)]);
}

function migrateLegacyStore() {
  const migrationName = 'import-json-store-v1';
  if (queryRows('SELECT 1 FROM migrations WHERE name = ?', [migrationName]).length > 0) return;
  if (!existsSync(legacyDataPath)) return;

  const legacyStore = JSON.parse(readFileSync(legacyDataPath, 'utf8'));
  if (
    !legacyStore ||
    !Array.isArray(legacyStore.predictions) ||
    !Array.isArray(legacyStore.trainingRuns)
  ) {
    throw new Error(`Legacy data file has an invalid format: ${legacyDataPath}`);
  }

  const importLegacyData = () => transaction(() => {
    for (const prediction of legacyStore.predictions) writePrediction(prediction);
    for (const run of legacyStore.trainingRuns) {
      const now = new Date().toISOString();
      const trainingRun = {
        ...run,
        _id: run._id || randomUUID(),
        createdAt: run.createdAt || now,
        updatedAt: run.updatedAt || now,
      };
      writeTrainingRun(trainingRun);
    }
    execute('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
  });

  importLegacyData();
  persistDatabase();
}

migrateLegacyStore();

export function findUserByEmail(email) {
  return queryRows(
    'SELECT id, full_name, email, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE',
    [email],
  )[0] ?? null;
}

export function createUser({ fullName, email, passwordHash }) {
  const now = new Date().toISOString();
  const user = { id: randomUUID(), fullName, email, passwordHash, createdAt: now };
  transaction(() => {
    const isFirstUser = queryRows('SELECT COUNT(*) AS count FROM users')[0].count === 0;
    execute(
      'INSERT INTO users (id, full_name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.fullName, user.email, user.passwordHash, now, now],
    );
    if (isFirstUser) execute('UPDATE predictions SET owner_id = ? WHERE owner_id IS NULL', [user.id]);
  });
  persistDatabase();
  return { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt };
}

export function findUserById(id) {
  const user = queryRows(
    'SELECT id, full_name, email, created_at FROM users WHERE id = ?',
    [id],
  )[0];
  return user ? {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    createdAt: user.created_at,
  } : null;
}

export function updateUserProfile(id, { fullName, email }) {
  const updatedAt = new Date().toISOString();
  execute('UPDATE users SET full_name = ?, email = ?, updated_at = ? WHERE id = ?', [
    fullName,
    email,
    updatedAt,
    id,
  ]);
  const user = findUserById(id);
  if (user) persistDatabase();
  return user;
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(userId, token, expiresAt) {
  execute('DELETE FROM sessions WHERE expires_at <= ?', [new Date().toISOString()]);
  execute('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [
    hashSessionToken(token),
    userId,
    expiresAt,
  ]);
  persistDatabase();
}

export function findUserBySession(token) {
  if (!token) return null;
  const user = queryRows(`
    SELECT users.id, users.full_name, users.email, users.created_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `, [hashSessionToken(token), new Date().toISOString()])[0];
  return user ? {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    createdAt: user.created_at,
  } : null;
}

export function deleteSession(token) {
  if (!token) return;
  execute('DELETE FROM sessions WHERE token_hash = ?', [hashSessionToken(token)]);
  persistDatabase();
}

export function emailBelongsToAnotherUser(email, userId) {
  return queryRows('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?', [email, userId]).length > 0;
}

export async function createPrediction(record, ownerId) {
  const now = new Date().toISOString();
  const prediction = writePrediction({ ...record, ownerId, createdAt: now, updatedAt: now });
  persistDatabase();
  return prediction;
}

export async function listPredictions({ status, sort = 'createdAt', order = 'desc' } = {}, ownerId) {
  const sortFields = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    jobTitle: 'job_title',
    companyName: 'company_name',
    prediction: 'prediction',
    riskScore: 'risk_score',
    confidence: 'confidence',
  };
  const sortField = Object.hasOwn(sortFields, sort) ? sortFields[sort] : 'created_at';
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const filters = [];
  const values = [];
  if (ownerId) {
    filters.push('owner_id = ?');
    values.push(ownerId);
  }
  if (status && status !== 'all') {
    filters.push('prediction = ?');
    values.push(status);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const rows = queryRows(
    `SELECT data_json FROM predictions ${where} ORDER BY ${sortField} ${direction}, rowid ASC`,
    values,
  );

  return rows.map((row) => JSON.parse(row.data_json));
}

export async function getPrediction(id, ownerId) {
  const row = queryRows('SELECT data_json FROM predictions WHERE id = ? AND owner_id = ?', [id, ownerId])[0];
  return row ? JSON.parse(row.data_json) : null;
}

export async function deletePrediction(id, ownerId) {
  const remove = () => transaction(() => {
    const row = queryRows('SELECT data_json FROM predictions WHERE id = ? AND owner_id = ?', [id, ownerId])[0];
    if (!row) return null;
    execute('DELETE FROM predictions WHERE id = ? AND owner_id = ?', [id, ownerId]);
    return JSON.parse(row.data_json);
  });
  const deleted = remove();
  if (deleted) persistDatabase();
  return deleted;
}

export async function getDashboardStats(ownerId) {
  const predictions = await listPredictions({}, ownerId);
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

export async function createTrainingRun(data, ownerId) {
  const now = new Date().toISOString();
  const run = { ...data, _id: randomUUID(), createdAt: now, updatedAt: now };
  writeTrainingRun(run, ownerId);
  persistDatabase();
  return run;
}

export async function listTrainingRuns(ownerId) {
  return queryRows(
    'SELECT data_json FROM training_runs WHERE owner_id = ? ORDER BY updated_at DESC, rowid DESC',
    [ownerId],
  ).map((row) => JSON.parse(row.data_json));
}

export async function updateTrainingRun(id, fields, ownerId) {
  const update = () => transaction(() => {
    const row = queryRows('SELECT data_json FROM training_runs WHERE id = ? AND owner_id = ?', [id, ownerId])[0];
    if (!row) return null;
    const run = JSON.parse(row.data_json);
    Object.assign(run, fields, { updatedAt: new Date().toISOString() });
    execute('UPDATE training_runs SET updated_at = ?, data_json = ? WHERE id = ? AND owner_id = ?', [
      run.updatedAt,
      JSON.stringify(run),
      id,
      ownerId,
    ]);
    return run;
  });
  const run = update();
  if (run) persistDatabase();
  return run;
}
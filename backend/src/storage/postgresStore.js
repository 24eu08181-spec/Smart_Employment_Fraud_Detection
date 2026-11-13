import pg from 'pg';
import { createHash, randomUUID } from 'node:crypto';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    prediction TEXT,
    job_title TEXT,
    company_name TEXT,
    risk_score DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    data_json JSONB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS predictions_created_at_idx ON predictions(created_at);
  CREATE INDEX IF NOT EXISTS predictions_owner_created_idx ON predictions(owner_id, created_at);
  CREATE TABLE IF NOT EXISTS training_runs (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL,
    data_json JSONB NOT NULL
  );
  CREATE INDEX IF NOT EXISTS training_runs_owner_updated_idx ON training_runs(owner_id, updated_at);
`;

let initialization;

function ensureInitialized() {
  if (!initialization) {
    initialization = pool.query(schema).catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function timestamp(value) {
  return new Date(value).toISOString();
}

function jsonValue(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function nullableNumber(value) {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapUser(row) {
  return row ? {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: timestamp(row.created_at),
  } : null;
}

async function transaction(operation) {
  await ensureInitialized();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserByEmail(email) {
  await ensureInitialized();
  const { rows } = await pool.query(
    'SELECT id, full_name, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  );
  return rows[0] ?? null;
}

export async function createUser({ fullName, email, passwordHash }) {
  const id = randomUUID();
  const now = new Date().toISOString();
  await transaction(async (client) => {
    const { rows } = await client.query('SELECT EXISTS (SELECT 1 FROM users) AS has_users');
    await client.query(
      'INSERT INTO users (id, full_name, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5)',
      [id, fullName, email, passwordHash, now],
    );
    if (!rows[0].has_users) {
      await client.query('UPDATE predictions SET owner_id = $1 WHERE owner_id IS NULL', [id]);
    }
  });
  return { id, fullName, email, createdAt: now };
}

export async function findUserById(id) {
  await ensureInitialized();
  const { rows } = await pool.query(
    'SELECT id, full_name, email, created_at FROM users WHERE id = $1',
    [id],
  );
  return mapUser(rows[0]);
}

export async function updateUserProfile(id, { fullName, email }) {
  await ensureInitialized();
  await pool.query(
    'UPDATE users SET full_name = $1, email = $2, updated_at = $3 WHERE id = $4',
    [fullName, email, new Date().toISOString(), id],
  );
  return findUserById(id);
}

export async function createSession(userId, token, expiresAt) {
  await transaction(async (client) => {
    await client.query('DELETE FROM sessions WHERE expires_at <= NOW()');
    await client.query(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [hashSessionToken(token), userId, expiresAt],
    );
  });
}

export async function findUserBySession(token) {
  if (!token) return null;
  await ensureInitialized();
  const { rows } = await pool.query(`
    SELECT users.id, users.full_name, users.email, users.created_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()
  `, [hashSessionToken(token)]);
  return mapUser(rows[0]);
}

export async function deleteSession(token) {
  if (!token) return;
  await ensureInitialized();
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
}

export async function emailBelongsToAnotherUser(email, userId) {
  await ensureInitialized();
  const { rows } = await pool.query(
    'SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1',
    [email, userId],
  );
  return rows.length > 0;
}

export async function createPrediction(record, ownerId) {
  await ensureInitialized();
  const now = new Date().toISOString();
  const prediction = {
    ...record,
    _id: record._id || randomUUID(),
    ownerId,
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
  };
  await pool.query(`
    INSERT INTO predictions
      (id, owner_id, created_at, updated_at, prediction, job_title, company_name, risk_score, confidence, data_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    ON CONFLICT (id) DO NOTHING
  `, [
    prediction._id,
    ownerId,
    prediction.createdAt,
    prediction.updatedAt,
    prediction.prediction ?? null,
    prediction.jobTitle ?? null,
    prediction.companyName ?? null,
    nullableNumber(prediction.riskScore),
    nullableNumber(prediction.confidence),
    JSON.stringify(prediction),
  ]);
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
    values.push(ownerId);
    filters.push(`owner_id = $${values.length}`);
  }
  if (status && status !== 'all') {
    values.push(status);
    filters.push(`prediction = $${values.length}`);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  await ensureInitialized();
  const { rows } = await pool.query(
    `SELECT data_json FROM predictions ${where} ORDER BY ${sortField} ${direction}, id ASC`,
    values,
  );
  return rows.map((row) => jsonValue(row.data_json));
}

export async function getPrediction(id, ownerId) {
  await ensureInitialized();
  const { rows } = await pool.query(
    'SELECT data_json FROM predictions WHERE id = $1 AND owner_id = $2',
    [id, ownerId],
  );
  return rows[0] ? jsonValue(rows[0].data_json) : null;
}

export async function deletePrediction(id, ownerId) {
  await ensureInitialized();
  const { rows } = await pool.query(
    'DELETE FROM predictions WHERE id = $1 AND owner_id = $2 RETURNING data_json',
    [id, ownerId],
  );
  return rows[0] ? jsonValue(rows[0].data_json) : null;
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
  await ensureInitialized();
  const now = new Date().toISOString();
  const run = { ...data, _id: randomUUID(), createdAt: now, updatedAt: now };
  await pool.query(`
    INSERT INTO training_runs (id, owner_id, updated_at, data_json)
    VALUES ($1, $2, $3, $4::jsonb)
  `, [run._id, ownerId, run.updatedAt, JSON.stringify(run)]);
  return run;
}

export async function listTrainingRuns(ownerId) {
  await ensureInitialized();
  const { rows } = await pool.query(
    'SELECT data_json FROM training_runs WHERE owner_id = $1 ORDER BY updated_at DESC, id DESC',
    [ownerId],
  );
  return rows.map((row) => jsonValue(row.data_json));
}

export async function updateTrainingRun(id, fields, ownerId) {
  return transaction(async (client) => {
    const { rows } = await client.query(
      'SELECT data_json FROM training_runs WHERE id = $1 AND owner_id = $2 FOR UPDATE',
      [id, ownerId],
    );
    if (!rows[0]) return null;
    const run = {
      ...jsonValue(rows[0].data_json),
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    await client.query(
      'UPDATE training_runs SET updated_at = $1, data_json = $2::jsonb WHERE id = $3 AND owner_id = $4',
      [run.updatedAt, JSON.stringify(run), id, ownerId],
    );
    return run;
  });
}

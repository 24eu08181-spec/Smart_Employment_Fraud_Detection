import { promisify } from 'node:util';
import {
  createSession,
  createUser,
  deleteSession,
  emailBelongsToAnotherUser,
  findUserByEmail,
  findUserById,
  findUserBySession,
  updateUserProfile,
} from '../storage/sqliteStore.js';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const scrypt = promisify(scryptCallback);
const sessionCookieName = 'sefd_session';
const sessionLifetimeSeconds = 7 * 24 * 60 * 60;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setSessionCookie(res, token) {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionLifetimeSeconds * 1000,
    path: '/api',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api',
  });
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

async function passwordMatches(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createLoginSession(res, user) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString();
  createSession(user.id, token, expiresAt);
  setSessionCookie(res, token);
  return findUserById(user.id);
}

export async function signup(req, res, next) {
  try {
    const body = req.body ?? {};
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (fullName.length < 2 || fullName.length > 80) {
      return res.status(400).json({ success: false, message: 'Enter a name between 2 and 80 characters.' });
    }
    if (email.length > 254 || !emailPattern.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
    }
    if (findUserByEmail(email)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = createUser({ fullName, email, passwordHash: await hashPassword(password) });
    res.status(201).json({ success: true, data: createLoginSession(res, user) });
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const body = req.body ?? {};
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const user = findUserByEmail(email);
    if (!user || !(await passwordMatches(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    }

    res.json({ success: true, data: createLoginSession(res, user) });
  } catch (error) {
    next(error);
  }
}

export function currentUser(req, res) {
  res.json({ success: true, data: req.user });
}

export function updateProfile(req, res) {
  const body = req.body ?? {};
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = normalizeEmail(body.email);
  if (fullName.length < 2 || fullName.length > 80) {
    return res.status(400).json({ success: false, message: 'Enter a name between 2 and 80 characters.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }
  if (emailBelongsToAnotherUser(email, req.user.id)) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = updateUserProfile(req.user.id, { fullName, email });
  res.json({ success: true, data: user });
}

export function logout(req, res) {
  deleteSession(req.cookies?.[sessionCookieName]);
  clearSessionCookie(res);
  res.json({ success: true, message: 'You have been logged out.' });
}

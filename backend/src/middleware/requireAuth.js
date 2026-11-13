import { findUserBySession } from '../storage/sqliteStore.js';

export function requireAuth(req, res, next) {
  const user = findUserBySession(req.cookies?.sefd_session);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }

  req.user = user;
  next();
}

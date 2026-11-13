import { findUserBySession } from '../storage/index.js';

export async function requireAuth(req, res, next) {
  try {
    const user = await findUserBySession(req.cookies?.sefd_session);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

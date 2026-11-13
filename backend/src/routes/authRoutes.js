import express from 'express';
import { currentUser, login, logout, signup, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, currentUser);
router.put('/profile', requireAuth, updateProfile);
router.post('/logout', requireAuth, logout);

export default router;

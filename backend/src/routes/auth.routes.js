const router = require('express').Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests from this IP, please try again later.' }
});

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',        authMiddleware, getMe);

module.exports = router;
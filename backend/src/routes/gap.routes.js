const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { analyse, getReports, getReport, deleteReport } = require('../controllers/gap.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const analyseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  message: { message: 'Gap analysis limit reached. Please try again in an hour.' },
});

// Analysis (expensive — rate-limited per IP)
router.post('/analyse', authMiddleware, analyseLimiter, upload.single('syllabus'), analyse);

// Report retrieval (with pagination support: ?page=1&limit=10)
router.get('/reports', authMiddleware, getReports);
router.get('/reports/:id', authMiddleware, getReport);

// GDPR-compliant deletion
router.delete('/reports/:id', authMiddleware, deleteReport);

module.exports = router;
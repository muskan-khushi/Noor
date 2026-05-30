const router = require('express').Router();
const { analyse, getReports, getReport, deleteReport } = require('../controllers/gap.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Analysis
router.post('/analyse', authMiddleware, upload.single('syllabus'), analyse);

// Report retrieval (with pagination support: ?page=1&limit=10)
router.get('/reports', authMiddleware, getReports);
router.get('/reports/:id', authMiddleware, getReport);

// GDPR-compliant deletion
router.delete('/reports/:id', authMiddleware, deleteReport);

module.exports = router;
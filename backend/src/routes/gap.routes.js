const router = require('express').Router();
const { analyse, getReports, getReport } = require('../controllers/gap.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.post('/analyse', authMiddleware, upload.single('syllabus'), analyse);
router.get('/reports', authMiddleware, getReports);
router.get('/reports/:id', authMiddleware, getReport);

module.exports = router;

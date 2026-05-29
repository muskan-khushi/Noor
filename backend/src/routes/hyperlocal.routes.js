const router = require('express').Router();
const { generate, batchGenerate, getRegions, getHistory } = require('../controllers/hyperlocal.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/generate', authMiddleware, generate);
router.post('/batch-generate', authMiddleware, batchGenerate);
router.get('/regions', getRegions);
router.get('/history', authMiddleware, getHistory);

module.exports = router;

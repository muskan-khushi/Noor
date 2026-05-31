const router = require('express').Router();
const { generate, generateBatch, listRegions, getHistory } = require('../controllers/hyperlocal.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/generate',       authMiddleware, generate);
router.post('/generate/batch', authMiddleware, generateBatch);
router.get('/regions',                         listRegions);
router.get('/history',         authMiddleware, getHistory);

module.exports = router;
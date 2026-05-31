const aiService      = require('../services/aiService');
const HyperContent   = require('../models/HyperContent.model');

/** POST /api/hyperlocal/generate */
async function generate(req, res, next) {
  try {
    const { original_text, concept, subject, class_level, region_key } = req.body;

    if (!original_text?.trim() || !concept?.trim() || !subject || !region_key) {
      return res.status(400).json({ message: 'original_text, concept, subject, and region_key are all required.' });
    }
    if (original_text.length > 4000) {
      return res.status(400).json({ message: 'original_text exceeds 4000 characters.' });
    }

    let result;
    try {
      result = await aiService.generateHyperlocal({ original_text, concept, subject, class_level, region_key });
    } catch (aiErr) { return next(aiErr); }

    // Persist asynchronously — non-blocking
    HyperContent.create({
      userId:         req.user.id,
      region:         result.region,
      region_key:     result.region_key || region_key,
      concept,
      subject,
      class_level,
      language_hint:  result.language_hint,
      original_text,
      rewritten_text: result.rewritten_text,
      changes_made:   result.changes_made || [],
      why_this_helps: result.why_this_helps,
      cognitive_load_reduction: result.cognitive_load_reduction,
      mathematical_invariance:  result.mathematical_invariance,
      cultural_authenticity_notes: result.cultural_authenticity_notes,
    }).catch(err => console.error('HyperContent save error (non-fatal):', err.message));

    res.json(result);
  } catch (err) { next(err); }
}

/** POST /api/hyperlocal/generate/batch */
async function generateBatch(req, res, next) {
  try {
    const { original_text, concept, subject, class_level, region_keys } = req.body;

    if (!original_text?.trim() || !concept?.trim() || !subject) {
      return res.status(400).json({ message: 'original_text, concept, and subject are required.' });
    }
    if (!Array.isArray(region_keys) || region_keys.length === 0) {
      return res.status(400).json({ message: 'region_keys must be a non-empty array.' });
    }
    if (region_keys.length > 6) {
      return res.status(400).json({ message: 'Maximum 6 regions per batch request.' });
    }

    let result;
    try {
      result = await aiService.generateHyperlocalBatch({ original_text, concept, subject, class_level, region_keys });
    } catch (aiErr) { return next(aiErr); }

    res.json(result);
  } catch (err) { next(err); }
}

/** GET /api/hyperlocal/regions */
async function listRegions(_req, res, next) {
  try {
    const regions = await aiService.listRegions();
    res.json(regions);
  } catch (err) { next(err); }
}

/** GET /api/hyperlocal/history */
async function getHistory(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const [history, total] = await Promise.all([
      HyperContent.find({ userId: req.user.id })
        .sort('-createdAt').skip((page-1)*limit).limit(limit).lean(),
      HyperContent.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ history, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
}

module.exports = { generate, generateBatch, listRegions, getHistory };
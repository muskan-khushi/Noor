const HyperContent = require('../models/HyperContent.model');
const aiService = require('../services/aiService');

async function generate(req, res, next) {
  try {
    const { original_text, concept, subject, class_level, region_key } = req.body;
    if (!original_text || !concept || !subject || !class_level || !region_key)
      return res.status(400).json({ message: 'original_text, concept, subject, class_level, and region_key are required' });
    const result = await aiService.generateHyperlocal({ original_text, concept, subject, class_level, region_key });

    await HyperContent.create({
      userId: req.user.id,
      original_text,
      rewritten_text: result.rewritten_text,
      region: result.region,
      concept,
      subject,
      changes_made: result.changes_made,
      why_this_helps: result.why_this_helps
    });

    res.json(result);
  } catch (err) { next(err); }
}

async function batchGenerate(req, res, next) {
  try {
    const { original_text, concept, subject, class_level, region_keys } = req.body;
    if (!original_text || !concept || !subject || !class_level || !region_keys || !Array.isArray(region_keys))
      return res.status(400).json({ message: 'original_text, concept, subject, class_level, and region_keys (array) are required' });
    
    const result = await aiService.batchGenerateHyperlocal({ original_text, concept, subject, class_level, region_keys });
    
    const records = result.results.map(r => ({
      userId: req.user.id,
      original_text: r.original_text || original_text,
      rewritten_text: r.rewritten_text,
      region: r.region,
      concept: r.concept || concept,
      subject: r.subject || subject,
      changes_made: r.changes_made,
      why_this_helps: r.why_this_helps
    }));

    if (records.length > 0) {
      await HyperContent.insertMany(records);
    }

    res.json(result);
  } catch (err) { next(err); }
}

async function getRegions(req, res, next) {
  try {
    const data = await aiService.listRegions();
    res.json(data);
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const history = await HyperContent.find({ userId: req.user.id }).sort('-createdAt').limit(20);
    res.json(history);
  } catch (err) { next(err); }
}

module.exports = { generate, batchGenerate, getRegions, getHistory };

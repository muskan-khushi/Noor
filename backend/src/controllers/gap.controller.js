const FormData = require('form-data');
const fs       = require('fs');
const GapReport  = require('../models/GapReport.model');
const aiService  = require('../services/aiService');

/**
 * POST /api/gap/analyse
 * Full gap analysis pipeline: validate → forward to AI engine → store → respond
 */
async function analyse(req, res, next) {
  const file = req.file;

  // Clean up the temp file once — safe to call multiple times
  let fileCleaned = false;
  const cleanup = () => {
    if (!fileCleaned && file?.path) {
      try { fs.unlinkSync(file.path); } catch (_) {}
      fileCleaned = true;
    }
  };

  try {
    const { board, exam, subject, max_module_generation } = req.body;

    const validExams    = ['NEET', 'JEE Mains', 'CUET'];
    const validSubjects = ['Chemistry', 'Physics', 'Mathematics', 'Biology'];

    if (!board || !exam || !subject) {
      cleanup();
      return res.status(400).json({ message: 'board, exam, and subject are all required.' });
    }
    if (!validExams.includes(exam)) {
      cleanup();
      return res.status(400).json({ message: `exam must be one of: ${validExams.join(', ')}` });
    }
    if (!validSubjects.includes(subject)) {
      cleanup();
      return res.status(400).json({ message: `subject must be one of: ${validSubjects.join(', ')}` });
    }
    if (!file) {
      return res.status(400).json({ message: 'A PDF file (field: syllabus) is required.' });
    }

    // ── Forward to AI engine ──────────────────────────────────────────────
    const form = new FormData();
    form.append('syllabus', fs.createReadStream(file.path), {
      filename:    file.originalname || 'syllabus.pdf',
      contentType: 'application/pdf',
    });
    form.append('board',   board);
    form.append('exam',    exam);
    form.append('subject', subject);
    if (max_module_generation != null) {
      form.append('max_module_generation', String(max_module_generation));
    }

    let aiResult;
    try {
      aiResult = await aiService.analyseGap(form, form.getHeaders());
    } catch (aiErr) {
      cleanup();
      return next(aiErr);
    }

    // Temp file is no longer needed — AI engine has consumed the stream
    cleanup();

    if (!aiResult) {
      return res.status(502).json({ message: 'No response from AI service.' });
    }

    // ── Persist to MongoDB ────────────────────────────────────────────────
    // Await the save so we can include the reportId in the response.
    // On DB failure we still return the AI result — the gap analysis itself
    // succeeded, we just won't be able to retrieve it from history later.
    let reportId = null;
    try {
      const report = await GapReport.create({
        userId:          req.user.id,
        stateBoard:      board,
        targetExam:      exam,
        subject,
        totalGapsFound:  aiResult.totalGapsFound  || 0,
        criticalGaps:    aiResult.criticalGaps     || 0,
        highGaps:        aiResult.highGaps         || 0,
        mediumGaps:      aiResult.mediumGaps       || 0,
        summary:         aiResult.summary          || '',
        alignmentScore:  aiResult.alignment_report?.alignment_score       ?? null,
        marksAtRisk:     aiResult.alignment_report?.marks_at_risk_estimate ?? null,
        studyHours:      aiResult.alignment_report?.study_hours_estimate   ?? null,
        alignmentReport: aiResult.alignment_report || null,
        gaps:            aiResult.gaps             || [],
      });
      reportId = report._id;
    } catch (dbErr) {
      // Non-fatal — log and continue without a reportId
      console.error('GapReport DB save failed (non-fatal):', dbErr.message);
    }

    return res.json({ reportId, ...aiResult });

  } catch (err) {
    cleanup();
    next(err);
  }
}

/**
 * GET /api/gap/reports?page=1&limit=10
 * All gap reports for the authenticated user (summary only, no gap details)
 */
async function getReports(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      GapReport.find({ userId: req.user.id })
        .select('-gaps')           // exclude full gap list for listing view
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      GapReport.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      reports,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/gap/reports/:id
 * Full gap report including all gap details and study modules
 */
async function getReport(req, res, next) {
  try {
    const report = await GapReport.findOne({
      _id:    req.params.id,
      userId: req.user.id,
    }).lean();

    if (!report) {
      return res.status(404).json({ message: 'Report not found or access denied.' });
    }
    res.json(report);
  } catch (err) { next(err); }
}

/**
 * DELETE /api/gap/reports/:id
 * Delete a gap report (GDPR compliance)
 */
async function deleteReport(req, res, next) {
  try {
    const result = await GapReport.deleteOne({
      _id:    req.params.id,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Report not found or access denied.' });
    }
    res.json({ message: 'Report deleted successfully.' });
  } catch (err) { next(err); }
}

module.exports = { analyse, getReports, getReport, deleteReport };
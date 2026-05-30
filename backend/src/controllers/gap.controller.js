const FormData = require('form-data');
const fs = require('fs');
const GapReport = require('../models/GapReport.model');
const aiService = require('../services/aiService');

/**
 * POST /api/gap/analyse
 * Full gap analysis pipeline: validate → forward to AI engine → store → respond
 */
async function analyse(req, res, next) {
  const file = req.file;
  let fileCleaned = false;

  const cleanup = () => {
    if (!fileCleaned && file?.path) {
      try { fs.unlinkSync(file.path); } catch (_) {}
      fileCleaned = true;
    }
  };

  try {
    const { board, exam, subject } = req.body;

    // Input validation
    const validExams = ['NEET', 'JEE Mains', 'CUET'];
    const validSubjects = ['Chemistry', 'Physics', 'Mathematics', 'Biology'];
    const validBoards = [
      'Maharashtra', 'Tamil Nadu', 'Rajasthan', 'Kerala', 'Punjab',
      'West Bengal', 'Andhra Pradesh', 'Karnataka', 'Gujarat',
      'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Odisha', 'Assam',
    ];

    if (!board || !exam || !subject) {
      cleanup();
      return res.status(400).json({ message: 'board, exam, and subject are all required' });
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
      return res.status(400).json({ message: 'A PDF file (field: syllabus) is required' });
    }

    // Forward to AI engine as multipart/form-data
    const form = new FormData();
    form.append('syllabus', fs.createReadStream(file.path), {
      filename: file.originalname || 'syllabus.pdf',
      contentType: 'application/pdf',
    });
    form.append('board', board);
    form.append('exam', exam);
    form.append('subject', subject);

    let aiResult;
    try {
      aiResult = await aiService.analyseGap(form, form.getHeaders());
    } catch (aiErr) {
      cleanup();
      return next(aiErr);  // Let error middleware handle AI service errors
    } finally {
      cleanup();
    }

    if (!aiResult) {
      return res.status(502).json({ message: 'No response from AI service' });
    }

    // Persist to MongoDB — don't block response on DB write
    GapReport.create({
      userId:         req.user.id,
      stateBoard:     board,
      targetExam:     exam,
      subject,
      totalGapsFound: aiResult.totalGapsFound || 0,
      criticalGaps:   aiResult.criticalGaps || 0,
      highGaps:       aiResult.highGaps || 0,
      mediumGaps:     aiResult.mediumGaps || 0,
      summary:        aiResult.summary || '',
      alignmentScore: aiResult.alignment_report?.alignment_score || null,
      marksAtRisk:    aiResult.alignment_report?.marks_at_risk_estimate || null,
      studyHours:     aiResult.alignment_report?.study_hours_estimate || null,
      gaps:           aiResult.gaps || [],
    }).then(report => {
      // Return with reportId
      return res.json({ reportId: report._id, ...aiResult });
    }).catch(dbErr => {
      // DB failure is non-fatal — still return AI result without reportId
      console.error('DB save failed (non-fatal):', dbErr.message);
      return res.json({ reportId: null, ...aiResult, _db_warning: 'Report not saved to database' });
    });

  } catch (err) {
    cleanup();
    next(err);
  }
}

/**
 * GET /api/gap/reports
 * All gap reports for the authenticated user (summary only, no gap details)
 */
async function getReports(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      GapReport.find({ userId: req.user.id })
        .select('-gaps')  // Exclude gap details for listing
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
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!report) {
      return res.status(404).json({ message: 'Report not found or access denied' });
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
      _id: req.params.id,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Report not found or access denied' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { analyse, getReports, getReport, deleteReport };
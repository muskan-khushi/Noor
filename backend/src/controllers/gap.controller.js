const FormData = require('form-data');
const fs = require('fs');
const GapReport = require('../models/GapReport.model');
const aiService = require('../services/aiService');

async function analyse(req, res, next) {
  try {
    const { board, exam, subject } = req.body;
    if (!board || !exam || !subject) return res.status(400).json({ message: 'board, exam, and subject are required' });
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'PDF file required' });

    // Forward multipart to Python AI engine
    const form = new FormData();
    form.append('syllabus', fs.createReadStream(file.path), { filename: file.originalname, contentType: 'application/pdf' });
    form.append('board', board);
    form.append('exam', exam);
    form.append('subject', subject);

    let aiResult;
    try {
      aiResult = await aiService.analyseGap(form, form.getHeaders());
    } finally {
      fs.unlinkSync(file.path);
    }

    if (!aiResult) return res.status(502).json({ message: 'No response from AI service' });

    // Save to MongoDB
    const report = await GapReport.create({
      userId: req.user.id,
      stateBoard: board,
      targetExam: exam,
      subject,
      totalGapsFound: aiResult.totalGapsFound,
      criticalGaps: aiResult.criticalGaps,
      summary: aiResult.summary,
      gaps: aiResult.gaps
    });

    res.json({ reportId: report._id, ...aiResult });
  } catch (err) { next(err); }
}

async function getReports(req, res, next) {
  try {
    const reports = await GapReport.find({ userId: req.user.id }).select('-gaps').sort('-createdAt');
    res.json(reports);
  } catch (err) { next(err); }
}

async function getReport(req, res, next) {
  try {
    const report = await GapReport.findOne({ _id: req.params.id, userId: req.user.id });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) { next(err); }
}

module.exports = { analyse, getReports, getReport };

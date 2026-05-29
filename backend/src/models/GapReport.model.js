const mongoose = require('mongoose');

const GapItemSchema = new mongoose.Schema({
  topic: String,
  similarity_score: Number,
  priority: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM'] },
  closest_state_topic: String,
  studyModule: {
    explanation: String,
    key_points: [String],
    example_problem: String,
    solution: String,
    common_mistake: String
  }
});

const GapReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stateBoard: String,
  targetExam: String,
  subject: String,
  totalGapsFound: Number,
  criticalGaps: Number,
  summary: String,
  gaps: [GapItemSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GapReport', GapReportSchema);

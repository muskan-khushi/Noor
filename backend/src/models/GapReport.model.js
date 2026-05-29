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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stateBoard: { type: String, required: true },
  targetExam: { type: String, required: true },
  subject: { type: String, required: true },
  totalGapsFound: Number,
  criticalGaps: Number,
  summary: String,
  gaps: [GapItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('GapReport', GapReportSchema);

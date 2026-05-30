const mongoose = require('mongoose');

// ── Signal Breakdown Sub-schema ────────────────────────────────────────────
const SignalBreakdownSchema = new mongoose.Schema({
  dense_cosine:  { type: Number, min: 0, max: 1 },
  bm25_lexical:  { type: Number, min: 0, max: 1 },
  ngram_jaccard: { type: Number, min: 0, max: 1 },
}, { _id: false });

// ── Study Module Sub-schema ────────────────────────────────────────────────
const StudyModuleSchema = new mongoose.Schema({
  explanation:             { type: String },
  prerequisite_concepts:   [{ type: String }],
  bloom_level:             { type: String, enum: ['Remember','Understand','Apply','Analyse','Evaluate','Create'] },
  key_points:              [{ type: String }],
  mnemonics:               { type: String },
  example_problem:         { type: String },
  example_problem_bloom:   { type: String },
  solution:                { type: String },
  common_mistake:          { type: String },
  common_mistake_why:      { type: String },
  similar_topics:          [{ type: String }],
  difficulty_estimate:     { type: String, enum: ['Easy','Medium','Hard'] },
}, { _id: false });

// ── Gap Item Sub-schema ────────────────────────────────────────────────────
const GapItemSchema = new mongoose.Schema({
  topic:                { type: String, required: true },
  fused_score:          { type: Number, min: 0, max: 1 },
  similarity_score:     { type: Number, min: 0, max: 1 },
  signal_breakdown:     { type: SignalBreakdownSchema },
  confidence_interval:  [{ type: Number }],
  exam_frequency:       { type: Number, min: 0, max: 1 },
  composite_priority:   { type: Number, min: 0, max: 1 },
  closest_state_topic:  { type: String },
  priority:             { type: String, enum: ['CRITICAL','HIGH','MEDIUM'], required: true },
  studyModule:          { type: StudyModuleSchema },
}, { _id: false });

// ── Alignment Report Sub-schema ────────────────────────────────────────────
const AlignmentReportSchema = new mongoose.Schema({
  alignment_score:         { type: Number },   // % of national topics covered
  weighted_alignment:      { type: Number },   // frequency-weighted coverage
  total_national_topics:   { type: Number },
  total_gaps:              { type: Number },
  coverage_by_band: {
    CRITICAL: { type: Number },
    HIGH:     { type: Number },
    MEDIUM:   { type: Number },
    COVERED:  { type: Number },
  },
  marks_at_risk_estimate:  { type: Number },
  study_hours_estimate:    { type: Number },
}, { _id: false });

// ── Main Gap Report Schema ─────────────────────────────────────────────────
const GapReportSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stateBoard:     { type: String, required: true },
  targetExam:     { type: String, required: true },
  subject:        { type: String, required: true },
  totalGapsFound: { type: Number, default: 0 },
  criticalGaps:   { type: Number, default: 0 },
  highGaps:       { type: Number, default: 0 },
  mediumGaps:     { type: Number, default: 0 },
  summary:        { type: String },
  // Cached top-level alignment metrics for dashboard display
  alignmentScore: { type: Number },
  marksAtRisk:    { type: Number },
  studyHours:     { type: Number },
  alignmentReport: { type: AlignmentReportSchema },
  gaps:           [GapItemSchema],
}, {
  timestamps: true,
  // Avoid storing huge arrays in main collection index
});

// ── Indexes ────────────────────────────────────────────────────────────────
GapReportSchema.index({ userId: 1, createdAt: -1 });         // user's report list
GapReportSchema.index({ userId: 1, targetExam: 1 });          // filter by exam
GapReportSchema.index({ userId: 1, subject: 1 });             // filter by subject

module.exports = mongoose.model('GapReport', GapReportSchema);
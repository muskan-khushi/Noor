const mongoose = require('mongoose');

const InvarianceSchema = new mongoose.Schema({
  invariant:       { type: Boolean },
  missing_numbers: [String],
  extra_numbers:   [String],
  warning:         { type: String },
}, { _id: false });

const HyperContentSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region:          { type: String, required: true },
  region_key:      { type: String, required: true },
  concept:         { type: String },
  subject:         { type: String },
  class_level:     { type: String },
  language_hint:   { type: String },
  original_text:   { type: String, required: true },
  rewritten_text:  { type: String, required: true },
  changes_made:    [String],
  why_this_helps:  { type: String },
  cognitive_load_reduction: { type: String },
  mathematical_invariance:  { type: InvarianceSchema },
  cultural_authenticity_notes: { type: String },
}, { timestamps: true });

HyperContentSchema.index({ userId: 1, createdAt: -1 });
HyperContentSchema.index({ userId: 1, region_key: 1 });

module.exports = mongoose.model('HyperContent', HyperContentSchema);
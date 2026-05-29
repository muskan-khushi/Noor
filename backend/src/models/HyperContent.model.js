const mongoose = require('mongoose');

const HyperContentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  original_text: { type: String, required: true },
  rewritten_text: { type: String, required: true },
  region: String,
  concept: String,
  subject: String,
  changes_made: [String],
  why_this_helps: String
}, { timestamps: true });

module.exports = mongoose.model('HyperContent', HyperContentSchema);

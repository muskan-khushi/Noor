const mongoose = require('mongoose');

const HyperContentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  original_text: String,
  rewritten_text: String,
  region: String,
  concept: String,
  subject: String,
  changes_made: [String],
  why_this_helps: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HyperContent', HyperContentSchema);

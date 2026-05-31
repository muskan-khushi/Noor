const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  class:      { type: String, enum: ['9','10','11','12'], required: true },
  stateBoard: { type: String, required: true },
  district:   { type: String, required: true },
  targetExam: { type: String },
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Generate JWT
UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Safe public projection
UserSchema.methods.toPublic = function () {
  return {
    id:         this._id,
    name:       this.name,
    email:      this.email,
    class:      this.class,
    stateBoard: this.stateBoard,
    district:   this.district,
    targetExam: this.targetExam,
    createdAt:  this.createdAt,
  };
};

UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
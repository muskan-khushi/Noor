const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

async function register(req, res, next) {
  try {
    const { name, email, password, class: cls, stateBoard, district, targetExam } = req.body;
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, class: cls, stateBoard, district, targetExam });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name, email, class: cls, stateBoard, district, targetExam } });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email, class: user.class, stateBoard: user.stateBoard, district: user.district, targetExam: user.targetExam } });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { register, login, me };

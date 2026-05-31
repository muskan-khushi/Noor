const User = require('../models/User.model');

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { name, email, password, class: cls, stateBoard, district, targetExam } = req.body;

    if (!name || !email || !password || !cls || !stateBoard || !district) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });

    const user  = await User.create({ name, email, password, class: cls, stateBoard, district, targetExam });
    const token = user.generateToken();

    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) { next(err); }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = user.generateToken();
    res.json({ token, user: user.toPublic() });
  } catch (err) { next(err); }
}

/** GET /api/auth/me */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { register, login, getMe };
const multer = require('multer');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(Object.assign(new Error('Only PDF files are allowed'), { status: 400 }), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = { upload };

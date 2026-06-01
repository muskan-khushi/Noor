// eslint-disable-next-line no-unused-vars
module.exports = function errorMiddleware(err, _req, res, _next) {
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 10 MB.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: 'Only one file may be uploaded at a time.' });
  }

  // AI service errors (forwarded from aiService)
  if (err.isAiServiceError) {
    const status  = err.aiStatus  || 502;
    const message = err.aiMessage || 'AI engine returned an error.';
    return res.status(status).json({ message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join('; ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already exists.` });
  }

  // Generic
  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${status} — ${message}`, err.stack?.split('\n')[1] || '');
  }

  const outputMessage = (status === 500 && process.env.NODE_ENV === 'production') 
    ? 'Internal server error' 
    : message;
  res.status(status).json({ message: outputMessage });
};
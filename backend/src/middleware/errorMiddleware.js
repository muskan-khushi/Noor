function errorMiddleware(err, req, res, next) {
  console.error(err.stack);

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key error' });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(statusCode).json({ message });
}

module.exports = { errorMiddleware };

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(500).json({ error: 'Database operation failed' });
  }

  if (err.name === 'PrismaClientInitializationError') {
    return res.status(500).json({ error: 'Database connection failed. Check DATABASE_URL and database status.' });
  }

  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error'
  });
};

module.exports = errorHandler;

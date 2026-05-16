const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  if (err.code === 'P1010') {
    return res.status(500).json({ error: 'Database access denied. Check DATABASE_URL permissions.' });
  }

  if (err.name === 'PrismaClientInitializationError') {
    return res.status(500).json({ error: 'Database connection failed. Check DATABASE_URL and database status.' });
  }

  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error'
  });
};

module.exports = errorHandler;

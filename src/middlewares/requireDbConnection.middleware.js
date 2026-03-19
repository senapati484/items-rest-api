const { isDbConnected } = require('../config/db');

const requireDbConnection = (req, res, next) => {
  if (isDbConnected()) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'Database unavailable. Please try again later.',
  });
};

module.exports = requireDbConnection;

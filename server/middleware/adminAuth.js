'use strict';

module.exports = function adminAuth(req, res, next) {
  const required = process.env.ADMIN_PASSWORD;
  if (!required) return next(); // no password configured, open access
  if (req.headers['x-admin-password'] === required) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

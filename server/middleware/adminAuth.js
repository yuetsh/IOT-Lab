'use strict';

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[adminAuth] ADMIN_PASSWORD not set — admin routes are open to everyone');
}

module.exports = function adminAuth(req, res, next) {
  const required = process.env.ADMIN_PASSWORD;
  if (!required) return next(); // no password configured, open access
  if (req.headers['x-admin-password'] === required) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

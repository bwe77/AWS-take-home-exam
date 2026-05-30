const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'freshbasket_dev_secret';

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'ceo') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireCEO(req, res, next) {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({ error: 'CEO access required' });
  }
  next();
}

// Alias for clarity
export const requireAdminOrCEO = requireAdmin;

export { JWT_SECRET };

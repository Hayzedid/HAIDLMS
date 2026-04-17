import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Authenticate JWT token
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require instructor role
 */
export function requireInstructor(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Instructor access required' });
  }

  next();
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

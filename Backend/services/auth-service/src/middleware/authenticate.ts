import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { TokenPayload, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };

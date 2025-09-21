import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.userId = userId;
  next();
};
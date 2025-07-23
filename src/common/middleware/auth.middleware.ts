import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt.utils';
import createError from 'http-errors';
import { JwtPayload } from '../../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token from cookies and attach user to request
 */
export const AuthGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw createError(401, 'Access token is required');
    }

    // Verify token and attach user to request
    const decoded = JwtUtils.verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};
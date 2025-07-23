import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types';
import createError from 'http-errors';

export class JwtUtils {
  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string, secret?: string): JwtPayload {
    try {
      const jwtSecret = secret || process.env['JWT_SECRET'];
      if (!jwtSecret) {
        throw new Error('JWT secret is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError(401, 'Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createError(401, 'Invalid token');
      }
      throw createError(500, 'Token verification failed');
    }
  }

  /**
   * Extract user info from JWT token without verification (USE WITH CAUTION)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Generate access token
   */
  static generateAccessToken(userId: string, email: string): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET is not defined');
    
    return jwt.sign(
      { userId, email },
      secret,
      { expiresIn: process.env['JWT_EXPIRE'] || '7d' }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(): string {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
    
    return jwt.sign(
      { type: 'refresh' },
      secret,
      { expiresIn: process.env['JWT_REFRESH_EXPIRE'] || '30d' }
    );
  }

  /**
   * Extract user from request (from cookies or Authorization header)
   */
  static extractUserFromRequest(req: any): JwtPayload | null {
    try {
      // Check cookies first
      let token = req.cookies?.accessToken;
      
      // If not in cookies, check Authorization header
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) return null;

      return JwtUtils.verifyToken(token);
    } catch {
      return null;
    }
  }
}
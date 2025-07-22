// src/common/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';
import logger from '../utils/logger';
import { ApiErrorDto } from '../types/common.types';


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id
  });

  // Handle http-errors
  if (err instanceof HttpError) {
    const errorResponse: ApiErrorDto = {
      status: err.statusCode,
      message: err.message,
      error: {
        code: err.name.toUpperCase().replace(/\s+/g, '_'),
        details: (err as any).details
      }
    };

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongooseError = err as any;
    const errors = Object.keys(mongooseError.errors).reduce((acc, key) => {
      acc[key] = mongooseError.errors[key].message;
      return acc;
    }, {} as any);

    return res.status(400).json({
      status: 400,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    return res.status(409).json({
      status: 409,
      message: `${field} already exists`,
      error: {
        code: 'DUPLICATE_KEY',
        details: { field }
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 401,
      message: 'Invalid token',
      error: { code: 'INVALID_TOKEN' }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 401,
      message: 'Token expired',
      error: { code: 'TOKEN_EXPIRED' }
    });
  }

  // Unknown errors
  const errorResponse: ApiErrorDto = {
    status: 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
    error: {
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  return res.status(500).json(errorResponse);
};
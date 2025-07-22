import { Request, Response, NextFunction } from 'express';

/**
 * Async handler to wrap route handlers and catch errors.
 * This allows us to avoid try-catch blocks in every route handler.
 * Instead, any error thrown in the handler will be passed to the next middleware.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
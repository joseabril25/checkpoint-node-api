// src/common/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import createError from 'http-errors';

export const ValidateDTO = <T extends object>(
  dtoClass: new () => T, 
  source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const dto = plainToInstance(dtoClass, req[source]);
      const errors = await validate(dto);
      
      if (errors.length > 0) {
        const errorMessages = errors.map(error => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', ')
        }));
        
        throw createError(400, 'Validation failed', { details: errorMessages });
      }
      
      // Replace with validated DTO based on source
      if (source === 'body') {
        req.body = dto;
      } else if (source === 'params') {
        req.params = dto as any;
      } else if (source === 'query') {
        Object.assign(req.query, dto);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
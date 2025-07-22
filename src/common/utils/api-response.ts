import { Response } from 'express';
import { ApiResponseDto, PaginatedResponseDto } from '../types/common.types';

/**
 * Utility class for standardizing API responses.
 * Provides methods to send success, created, paginated, and no content responses.
 * Used for controllers to maintain consistent response structure.
 */
export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    const response: ApiResponseDto<T> = {
      status: statusCode,
      message,
      data
    };
    
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message = 'Created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    },
    message = 'Success'
  ): Response {
    const response: PaginatedResponseDto<T> = {
      status: 200,
      message,
      data,
      pagination
    };
    
    return res.status(200).json(response);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
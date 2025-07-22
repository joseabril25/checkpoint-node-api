import { Router } from 'express';

import { registerUser } from './auth.controller';
import { validateDto } from '../../common/middleware/validation.middleware';
import { RegisterRequestDto } from './DTOs/register.dto';

const router = Router();

// POST /api/v1/auth/register
router.post('/register',
  validateDto(RegisterRequestDto),
  registerUser
);

export { router as authRoutes };
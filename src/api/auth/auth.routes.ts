import { Router } from 'express';

import { loginUser, logoutUser, refreshAccessToken, registerUser } from './auth.controller';
import { validateDto } from '../../common/middleware/validation.middleware';
import { RegisterRequestDto } from './DTOs/register.dto';
import { LoginRequestDto } from './DTOs/login.dto';

const router = Router();

// POST /api/v1/auth/register
router.post('/register',
  validateDto(RegisterRequestDto),
  registerUser
);

// POST /api/v1/auth/login
router.post('/login',
  validateDto(LoginRequestDto),
  loginUser
);

router.post('/logout',
  logoutUser
);

router.post('/refresh-token',
  refreshAccessToken
)

export { router as authRoutes };
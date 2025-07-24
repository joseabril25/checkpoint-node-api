import { Router } from 'express';

import { loginUser, logoutUser, refreshAccessToken, registerUser, getCurrentUser } from './auth.controller';
import { ValidateDTO } from '../../common/middleware/validation.middleware';
import { RegisterRequestDto } from './DTOs/register.dto';
import { LoginRequestDto } from './DTOs/login.dto';
import { AuthGuard } from '../../common/middleware';

const router = Router();

// POST /api/v1/auth/register
router.post('/register',
  ValidateDTO(RegisterRequestDto),
  registerUser
);

// POST /api/v1/auth/login
router.post('/login',
  ValidateDTO(LoginRequestDto),
  loginUser
);

router.post('/logout',
  AuthGuard,
  logoutUser
);

router.post('/refresh-token',
  AuthGuard,
  refreshAccessToken
);

// GET /api/v1/auth/me
router.get('/me',
  AuthGuard,
  getCurrentUser
);

export { router as authRoutes };
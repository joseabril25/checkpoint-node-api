import { Router } from 'express';
import { authRoutes } from './auth/auth.routes';
import { standupRoutes } from './standups/standup.routes';

const apiRouter = Router();

// Group all API routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/standups', standupRoutes);

export { apiRouter };
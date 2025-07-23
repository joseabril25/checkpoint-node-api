// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './common/middleware';
import { authRoutes } from './api/auth/auth.routes';
// import mongoSanitize from 'express-mongo-sanitize';
// import compression from 'compression';
// import { errorHandler } from './common/middleware/error.middleware';

// import routes from './api';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
// app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(mongoSanitize());

// Routes
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export default app;
// src/server.ts
import 'dotenv/config';
import app from './app';

// import logger from './common/utils/logger';
import { connectDatabase } from './storage/database.config';
import logger from './common/utils/logger';


const PORT = process.env['PORT'] || 3001;

const start = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`Server running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
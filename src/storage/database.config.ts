import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = {
      autoIndex: false, // Build indexes in development
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      dbName: process.env['MONGODB_NAME'] || 'checkpoint-dev', // Use the database name from environment variable or default
    };

    await mongoose.connect(
      process.env['MONGODB_URI'] as string || 'mongodb://localhost:27017/checkpoint-dev', 
      options);

    console.log(`MongoDB is connected: ${mongoose.connection.name}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost');
});
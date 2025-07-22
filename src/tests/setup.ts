import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Increase timeout for downloading MongoDB binaries on first run
jest.setTimeout(60000);

beforeAll(async () => {
  try {
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    console.log('📦 Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    
    // Stop the in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('📦 Test database disconnected');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    // Clear all collections after each test
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    throw error;
  }
});

// Optional: Suppress mongoose logs during tests
mongoose.set('debug', false);
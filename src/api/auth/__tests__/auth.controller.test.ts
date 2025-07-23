import request from 'supertest';
import app from '../../../app'
import { authRoutes } from '../auth.routes';
import { JwtUtils } from '../../../common/utils';

// Mock JWT utilities
jest.mock('../../../common/utils/jwt.utils');

describe('Auth Controller Integration Tests', () => {   
  const testUserData = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    timezone: 'UTC'
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  beforeAll(() => {
    // Create Express app for testing
    app.use('/api/v1/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT utils with unique tokens
    (JwtUtils.generateAccessToken as jest.Mock).mockReturnValue(mockTokens.accessToken);
    (JwtUtils.generateRefreshToken as jest.Mock).mockImplementation(() => 
      `mock-refresh-token-${Date.now()}-${Math.random()}`
    );
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        status: 201,
        message: 'User registered successfully',
        data: {
          id: expect.any(String),
          email: testUserData.email,
          name: testUserData.name,
          timezone: testUserData.timezone,
          profileImage: null,
          status: 'active',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });

      // Check cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 409 if user already exists', async () => {
      // Register user first
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUserData);

      // Try to register same user again
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUserData)
        .expect(409);

      expect(response.body).toMatchObject({
        status: 409,
        message: expect.stringContaining('already exists')
      });
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = {
        ...testUserData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return 400 for short password', async () => {
      const invalidData = {
        ...testUserData,
        password: '123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        email: testUserData.email
        // Missing password and name
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUserData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: testUserData.email,
        password: testUserData.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 200,
        message: 'User logged in successfully',
        data: {
          id: expect.any(String),
          email: testUserData.email,
          name: testUserData.name,
          timezone: testUserData.timezone,
          profileImage: null,
          status: 'active',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });

      // Check cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: testUserData.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: 401,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: testUserData.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: 401,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: testUserData.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return 400 for missing fields', async () => {
      const loginData = {
        email: testUserData.email
        // Missing password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should set secure cookies in production', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const loginData = {
        email: testUserData.email,
        password: testUserData.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies.some((cookie: string) => cookie.includes('Secure'))).toBe(true);

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
});
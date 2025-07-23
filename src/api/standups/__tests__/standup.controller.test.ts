import request from 'supertest';
import app from '../../../app';
import { User } from '../../../models';
import { JwtUtils } from '../../../common/utils';
import { standupRoutes } from '../standup.routes';
import createError from 'http-errors';

// Mock JWT utilities
jest.mock('../../../common/utils/jwt.utils');

describe('Standup Controller Integration Tests', () => {
  let testUser: any;
  let authCookie: string;

  const testUserData = {
    email: 'standupuser@example.com',
    password: 'password123',
    name: 'Standup Test User',
    timezone: 'UTC'
  };

  const testStandupData = {
    yesterday: 'Completed authentication module',
    today: 'Working on standup functionality',
    blockers: 'None',
    status: 'draft'
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  beforeAll(async () => {
    // Setup routes
    app.use('/api/v1/standups', standupRoutes);

    // Create test user
    testUser = await User.create(testUserData);

    // Mock JWT verification to return our test user
    (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
      userId: testUser.id,
      email: testUser.email
    });

    // Create auth cookie for requests
    authCookie = `accessToken=${mockTokens.accessToken}`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/standups', () => {
    it('should create a new standup successfully', async () => {
      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(testStandupData)
        .expect(201);

      expect(response.body).toMatchObject({
        status: 201,
        message: 'Standup created successfully',
        data: {
          id: expect.any(String),
          userId: testUser.id,
          yesterday: testStandupData.yesterday,
          today: testStandupData.today,
          blockers: testStandupData.blockers,
          status: 'draft',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });

      // Verify JWT was checked
      expect(JwtUtils.verifyToken).toHaveBeenCalledWith(mockTokens.accessToken);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/standups')
        .send(testStandupData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: 401,
        message: expect.stringContaining('Access token is required')
      });
    });

    it('should return 401 with invalid token', async () => {
      // Mock JWT to throw the same error that JwtUtils would throw
      (JwtUtils.verifyToken as jest.Mock).mockImplementationOnce(() => {
        throw createError(401, 'Invalid token');
      });

      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', 'accessToken=invalid-token')
        .send(testStandupData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: 401,
        message: expect.stringContaining('Invalid token')
      });
      
      // Reset mock for next tests
      (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: testUser.id,
        email: testUser.email
      });
    });

    it('should return 400 for validation errors', async () => {
      const invalidData = {
        yesterday: '', // Empty required field
        today: '',
        blockers: '',
        status: 'invalid-status'
      };

      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        yesterday: 'Some work done'
        // Missing today and blockers
      };

      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(incompleteData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: 400,
        message: expect.stringContaining('Validation failed')
      });
    });

    it('should handle submitted status correctly', async () => {
      const submittedStandup = {
        ...testStandupData,
        status: 'submitted'
      };

      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(submittedStandup)
        .expect(201);

      expect(response.body.data.status).toBe('submitted');
    });

    it('should handle date parameter correctly', async () => {
      // Use yesterday's date to ensure it's valid
      const specificDate = new Date();
      specificDate.setDate(specificDate.getDate() - 1);
      specificDate.setHours(0, 0, 0, 0); // Normalize time
      
      const standupWithDate = {
        ...testStandupData,
        date: specificDate.toISOString()
      };

      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(standupWithDate)
        .expect(201);

      // Compare ISO date strings to avoid timezone issues
      const responseDate = new Date(response.body.data.date);
      const responseDateString = responseDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const expectedDateString = specificDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      expect(responseDateString).toBe(expectedDateString);
    });

    it('should preserve user context across requests', async () => {
      // Create standup with first user
      const response1 = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(testStandupData);

      // Create another user and mock different JWT
      const anotherUser = await User.create({
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User',
        timezone: 'UTC'
      });

      (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: anotherUser.id,
        email: anotherUser.email
      });

      const response2 = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', 'accessToken=another-token')
        .send(testStandupData);

      // Should be different standups for different users
      expect(response1.body.data.userId).toBe(testUser.id);
      expect(response2.body.data.userId).toBe(anotherUser.id);
      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });
});
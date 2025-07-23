import request from 'supertest';
import app from '../../../app';
import { User } from '../../../models';
import { JwtUtils } from '../../../common/utils';
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

  describe('PATCH /api/v1/standups/:id', () => {
    let existingStandup: any;

    beforeEach(async () => {
      // Create a standup to update
      const response = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send(testStandupData);
      
      existingStandup = response.body.data;
    });

    it('should update standup successfully', async () => {
      const updateData = {
        yesterday: 'Updated yesterday work',
        today: 'Updated today plan',
        status: 'submitted'
      };

      const response = await request(app)
        .patch(`/api/v1/standups/${existingStandup.id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 200,
        message: 'Standup updated successfully',
        data: {
          id: existingStandup.id,
          yesterday: updateData.yesterday,
          today: updateData.today,
          status: 'submitted'
        }
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/standups/${existingStandup.id}`)
        .send({ yesterday: 'Updated' })
        .expect(401);

      expect(response.body).toMatchObject({
        status: 401,
        message: expect.stringContaining('Access token is required')
      });
    });

    it('should return 404 for non-existent standup', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .patch(`/api/v1/standups/${fakeId}`)
        .set('Cookie', authCookie)
        .send({ yesterday: 'Updated' })
        .expect(404);

      expect(response.body).toMatchObject({
        status: 404,
        message: expect.stringContaining('Standup not found')
      });
    });
  });

  describe('GET /api/v1/standups', () => {
    let user1: any, user2: any;
    let user1Standup: any, user2Standup: any;

    beforeEach(async () => {
      // Create test users
      user1 = await User.create({
        email: 'user1@example.com',
        password: 'password123',
        name: 'User One',
        timezone: 'UTC'
      });

      user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User Two',
        timezone: 'UTC'
      });

      // Create today's standups
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      // Mock JWT for user1
      (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: user1.id,
        email: user1.email
      });

      // Create standups for today
      user1Standup = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send({
          ...testStandupData,
          date: today.toISOString(),
          yesterday: 'User1 today work'
        });

      // Switch to user2 
      (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: user2.id,
        email: user2.email
      });

      user2Standup = await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send({
          ...testStandupData,
          date: today.toISOString(),
          yesterday: 'User2 today work'
        });

      // Create yesterday's standup for user1
      (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: user1.id,
        email: user1.email
      });

      await request(app)
        .post('/api/v1/standups')
        .set('Cookie', authCookie)
        .send({
          ...testStandupData,
          date: yesterday.toISOString(),
          yesterday: 'User1 yesterday work'
        });
    });

    describe('Team View', () => {
      it('should show today\'s standups for all users (default)', async () => {
        const response = await request(app)
          .get('/api/v1/standups')
          .set('Cookie', authCookie)
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ yesterday: 'User1 today work' }),
            expect.objectContaining({ yesterday: 'User2 today work' })
          ])
        );
      });

      it('should show provided date\'s standups for all users (date filtered)', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        const response = await request(app)
          .get(`/api/v1/standups?date=${dateString}`)
          .set('Cookie', authCookie)
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          yesterday: 'User1 yesterday work'
        });
      });

      it('should show all user\'s standups from latest date (user filtered)', async () => {
        const response = await request(app)
          .get(`/api/v1/standups?userId=${user1.id}`)
          .set('Cookie', authCookie)
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.every((s: any) => s.userId === user1.id)).toBe(true);
      });

      it('should show user\'s standup for specified date (user and date filtered)', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        const response = await request(app)
          .get(`/api/v1/standups?userId=${user1.id}&date=${dateString}`)
          .set('Cookie', authCookie)
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          userId: user1.id,
          yesterday: 'User1 yesterday work'
        });
      });
    });

    describe('History View', () => {
      it('should show logged in user\'s standups from latest (default history)', async () => {
        // Mock as user1 to get their history
        (JwtUtils.verifyToken as jest.Mock).mockReturnValue({
          userId: user1.id,
          email: user1.email
        });

        const response = await request(app)
          .get(`/api/v1/standups?userId=${user1.id}`)
          .set('Cookie', authCookie)
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.every((s: any) => s.userId === user1.id)).toBe(true);
        
        // Should be sorted by date desc (latest first)
        const dates = response.body.data.map((s: any) => new Date(s.date));
        expect(dates[0] >= dates[1]).toBe(true);
      });

      it('should show user\'s standups on date filtered (history with date)', async () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const response = await request(app)
          .get(`/api/v1/standups?userId=${user1.id}&date=${dateString}`)
          .set('Cookie', authCookie)
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
          userId: user1.id,
          yesterday: 'User1 today work'
        });
      });
    });
  });
});
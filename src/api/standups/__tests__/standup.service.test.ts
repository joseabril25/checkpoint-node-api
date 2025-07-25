import { StandupService } from '../standup.service';
import { CreateStandupDto } from '../../../types';
import { Standup, StandupStatus, User } from '../../../models';

describe('StandupService Integration Tests', () => {
  let standupService: StandupService;
  let testUser: any;
  let userId: string

  // Test data
  const testUserData = {
    email: 'standup@example.com',
    password: 'password123',
    name: 'Standup User',
    timezone: 'UTC'
  };

  const testStandupData: CreateStandupDto = {
    yesterday: 'Completed authentication module',
    today: 'Working on standup functionality',
    blockers: 'None',
    status: StandupStatus.DRAFT
  };

  beforeAll(async () => {
    // Create a test user
    testUser = await User.create(testUserData);
    userId = testUser.id;
  });

  beforeEach(() => {
    standupService = new StandupService();
  });

  describe('createStandup', () => {
    it('should create a new standup successfully', async () => {
      // Act
      const result = await standupService.createStandup(userId, testStandupData);

      // Assert
      expect(result).toEqual({
        id: expect.any(String),
        userId: testUser.id,
        yesterday: testStandupData.yesterday,
        today: testStandupData.today,
        blockers: testStandupData.blockers,
        status: 'draft',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });

      // Verify standup exists in database
      const createdStandup = await Standup.findById(result.id);
      expect(createdStandup).toBeTruthy();
      expect(createdStandup?.userId.toString()).toBe(testUser.id);
      expect(createdStandup?.yesterday).toBe(testStandupData.yesterday);
    });

    it('should create multiple standups with automatic timestamps', async () => {
      // Arrange
      const firstStandup: CreateStandupDto = {
        ...testStandupData,
        yesterday: 'First standup'
      };

      const secondStandup: CreateStandupDto = {
        ...testStandupData,
        yesterday: 'Second standup'
      };

      // Act
      const firstResult = await standupService.createStandup(userId, firstStandup);
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const secondResult = await standupService.createStandup(userId, secondStandup);

      // Assert
      expect(firstResult.id).not.toBe(secondResult.id);
      expect(firstResult.yesterday).toBe('First standup');
      expect(secondResult.yesterday).toBe('Second standup');
      expect(new Date(secondResult.createdAt).getTime()).toBeGreaterThan(new Date(firstResult.createdAt).getTime());

      // Verify both exist in database
      const standups = await Standup.find({ userId: testUser.id });
      expect(standups.length).toBeGreaterThanOrEqual(2);
    });

    it('should set createdAt to current time automatically', async () => {
      // Arrange
      const standupData: CreateStandupDto = {
        ...testStandupData,
      };

      // Act
      const result = await standupService.createStandup(userId, standupData);

      // Assert
      const now = new Date();
      const resultCreatedAt = new Date(result.createdAt);
      const timeDifference = Math.abs(now.getTime() - resultCreatedAt.getTime());
      
      // Should be created within the last 5 seconds
      expect(timeDifference).toBeLessThan(5000);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should validate standup fields', async () => {
      // Arrange
      const invalidStandup: CreateStandupDto = {
        ...testStandupData,
        yesterday: '', // Empty required field
        today: '',
        blockers: ''
      };

      // Act & Assert
      await expect(standupService.createStandup(userId, invalidStandup))
        .rejects
        .toThrow(); // Should fail validation
    });
  });

  describe('updateStandup', () => {
    let existingStandup: any;

    beforeEach(async () => {
      // Create a standup to update
      existingStandup = await standupService.createStandup(userId, testStandupData);
    });

    it('should update standup successfully', async () => {
      // Arrange
      const updateData = {
        yesterday: 'Updated yesterday work',
        today: 'Updated today plan',
        status: StandupStatus.SUBMITTED
      };

      // Act  
      const result = await standupService.updateStandup(existingStandup.id, userId, updateData);

      // Assert
      expect(result.yesterday).toBe(updateData.yesterday);
      expect(result.today).toBe(updateData.today);
      expect(result.status).toBe('submitted');
      expect(result.updatedAt).not.toEqual(existingStandup.updatedAt);
    });

    it('should throw 404 for non-existent standup', async () => {
      // Arrange
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { yesterday: 'Updated' };

      // Act & Assert
      await expect(standupService.updateStandup(fakeId, userId, updateData))
        .rejects
        .toThrow(/Standup not found/);
    });
  });

  describe('getStandups', () => {
    let user1: any, user2: any;
    let user1Id: string, user2Id: string;

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

      user1Id = user1.id;
      user2Id = user2.id;

      // Create standups for different dates
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      // Create today's standups for both users
      await standupService.createStandup(user1Id, {
        ...testStandupData,
        yesterday: 'User1 today work'
      });

      await standupService.createStandup(user2Id, {
        ...testStandupData,
        yesterday: 'User2 today work'
      });

      // Note: We can no longer create standups for specific past dates
      // as the model now uses automatic createdAt timestamps
    });

    describe('Team View', () => {
      it('should show today\'s standups for all users (default)', async () => {
        const result = await standupService.getStandups({});

        expect(result.data).toHaveLength(2);
        expect(result.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ yesterday: 'User1 today work' }),
            expect.objectContaining({ yesterday: 'User2 today work' })
          ])
        );
      });

      it('should show today\'s standups when filtering by today\'s date', async () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const result = await standupService.getStandups({ date: dateString });

        expect(result.data).toHaveLength(2);
        expect(result.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ yesterday: 'User1 today work' }),
            expect.objectContaining({ yesterday: 'User2 today work' })
          ])
        );
      });

      it('should show all user\'s standups from latest date (user filtered)', async () => {
        const result = await standupService.getStandups({ userId: user1Id });

        expect(result.data).toHaveLength(1);
        expect(result.data.every((s: any) => s.userId === user1Id)).toBe(true);
      });

      it('should show user\'s standup for specified date (user and date filtered)', async () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const result = await standupService.getStandups({ 
          userId: user1Id, 
          date: dateString 
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          userId: user1Id,
          yesterday: 'User1 today work'
        });
      });
    });

    describe('History View', () => {
      it('should show user\'s standups from latest (user history)', async () => {
        const result = await standupService.getStandups({ userId: user1Id });

        expect(result.data).toHaveLength(1);
        expect(result.data.every((s: any) => s.userId === user1Id)).toBe(true);
      });

      it('should show user\'s standups on date filtered (history with date)', async () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const result = await standupService.getStandups({ 
          userId: user1Id, 
          date: dateString 
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          userId: user1Id,
          yesterday: 'User1 today work'
        });
      });
    });

    describe('Pagination', () => {
      it('should return pagination metadata', async () => {
        const result = await standupService.getStandups({ limit: 1 });

        expect(result.pagination).toMatchObject({
          page: 1,
          limit: 1,
          total: expect.any(Number),
          totalPages: expect.any(Number),
          hasMore: expect.any(Boolean)
        });
      });

      it('should handle page and limit parameters', async () => {
        const result = await standupService.getStandups({ 
          userId: user1Id,
          page: 1,
          limit: 1
        });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(1);
      });
    });
  });
});
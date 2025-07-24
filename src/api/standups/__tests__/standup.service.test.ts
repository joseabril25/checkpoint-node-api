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
        date: expect.any(Date),
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

    it('should handle different dates properly', async () => {
      // Arrange
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const todayStandup: CreateStandupDto = {
        ...testStandupData,
        yesterday: 'Today standup'
      };

      const yesterdayStandup: CreateStandupDto = {
        ...testStandupData,
        yesterday: 'Yesterday standup'
      };

      // Act
      const todayResult = await standupService.createStandup(userId, todayStandup);
      const yesterdayResult = await standupService.createStandup(userId, yesterdayStandup);

      // Assert
      expect(todayResult.id).not.toBe(yesterdayResult.id);
      expect(todayResult.yesterday).toBe('Today standup');
      expect(yesterdayResult.yesterday).toBe('Yesterday standup');

      // Verify both exist in database
      const standups = await Standup.find({ userId: testUser.id });
      expect(standups.length).toBeGreaterThanOrEqual(2);
    });

    it('should default to current date if no date provided', async () => {
      // Arrange
      const standupWithoutDate: CreateStandupDto = {
        ...testStandupData,
      };

      // Act
      const result = await standupService.createStandup(userId, standupWithoutDate);

      // Assert
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const resultDate = new Date(result.date);
      
      expect(resultDate.getUTCDate()).toBe(today.getUTCDate());
      expect(resultDate.getUTCMonth()).toBe(today.getUTCMonth());
      expect(resultDate.getUTCFullYear()).toBe(today.getUTCFullYear());
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
        date: today,
        yesterday: 'User1 today work'
      });

      await standupService.createStandup(user2Id, {
        ...testStandupData,
        date: today,
        yesterday: 'User2 today work'
      });

      // Create yesterday's standup for user1 
      await standupService.createStandup(user1Id, {
        ...testStandupData,
        date: yesterday,
        yesterday: 'User1 yesterday work'
      });
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

      it('should show provided date\'s standups for all users (date filtered)', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        const result = await standupService.getStandups({ date: dateString });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          yesterday: 'User1 yesterday work'
        });
      });

      it('should show all user\'s standups from latest date (user filtered)', async () => {
        const result = await standupService.getStandups({ userId: user1Id });

        expect(result.data).toHaveLength(2);
        expect(result.data.every((s: any) => s.userId === user1Id)).toBe(true);
      });

      it('should show user\'s standup for specified date (user and date filtered)', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        const result = await standupService.getStandups({ 
          userId: user1Id, 
          date: dateString 
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
          userId: user1Id,
          yesterday: 'User1 yesterday work'
        });
      });
    });

    describe('History View', () => {
      it('should show user\'s standups from latest (user history)', async () => {
        const result = await standupService.getStandups({ userId: user1Id });

        expect(result.data).toHaveLength(2);
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
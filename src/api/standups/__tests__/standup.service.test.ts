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
    date: new Date(),
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
        date: today,
        yesterday: 'Today standup'
      };

      const yesterdayStandup: CreateStandupDto = {
        ...testStandupData,
        date: yesterday,
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
        date: undefined as any
      };

      // Act
      const result = await standupService.createStandup(userId, standupWithoutDate);

      // Assert
      const today = new Date();
      const resultDate = new Date(result.date);
      
      expect(resultDate.getDate()).toBe(today.getDate());
      expect(resultDate.getMonth()).toBe(today.getMonth());
      expect(resultDate.getFullYear()).toBe(today.getFullYear());
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
});
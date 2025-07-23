import { StandupRepository } from '../standup.repository';
import { Standup, User, StandupStatus } from '../../../models';
import { StandupPaginatedResponseDto, StandupQueryDto } from '../../../types';

describe('StandupRepository Integration Tests', () => {
  let standupRepository: StandupRepository;
  let testUser1: any;
  let testUser2: any;

  beforeAll(async () => {
    standupRepository = new StandupRepository();
  });

  beforeEach(async () => {
    // Create test users for each test to avoid cleanup issues
    testUser1 = await User.create({
      email: 'repo.user1@example.com',
      password: 'password123',
      name: 'Repo User 1',
      timezone: 'UTC'
    });

    testUser2 = await User.create({
      email: 'repo.user2@example.com',
      password: 'password123',
      name: 'Repo User 2',
      timezone: 'UTC'
    });
  });

  describe('createStandup', () => {
    it('should create a standup with correct date', async () => {
      const date = new Date();
      date.setDate(date.getDate() - 1); // Yesterday
      
      const standupData = {
        date,
        yesterday: 'Completed task A',
        today: 'Working on task B',
        blockers: 'None',
        status: StandupStatus.DRAFT
      };

      const result = await standupRepository.createStandup(testUser1.id, standupData);

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUser1.id);
      expect(result.yesterday).toBe('Completed task A');
      
      // Check date is normalized to start of day (UTC)
      const savedDate = new Date(result.date);
      expect(savedDate.getUTCHours()).toBe(0);
      expect(savedDate.getUTCMinutes()).toBe(0);
      expect(savedDate.getUTCSeconds()).toBe(0);
    });

    it('should handle default date when not provided', async () => {
      const standupData = {
        yesterday: 'Default date test',
        today: 'Testing default date',
        blockers: 'None',
        status: StandupStatus.DRAFT
      };

      const result = await standupRepository.createStandup(testUser1.id, standupData);

      expect(result).toBeDefined();
      
      // Should default to today
      const today = new Date();
      const savedDate = new Date(result.date);
      expect(savedDate.getDate()).toBe(today.getDate());
      expect(savedDate.getMonth()).toBe(today.getMonth());
      expect(savedDate.getFullYear()).toBe(today.getFullYear());
    });
  });

  describe('findStandups', () => {
    beforeEach(async () => {
      // Create test data
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      // Create today's standups
      await standupRepository.createStandup(testUser1.id, {
        date: today,
        yesterday: 'User1 today work',
        today: 'User1 today plan',
        blockers: 'None',
        status: StandupStatus.SUBMITTED
      });

      await standupRepository.createStandup(testUser2.id, {
        date: today,
        yesterday: 'User2 today work',
        today: 'User2 today plan',
        blockers: 'None',
        status: StandupStatus.DRAFT
      });

      // Create yesterday's standup for user1
      await standupRepository.createStandup(testUser1.id, {
        date: yesterday,
        yesterday: 'User1 yesterday work',
        today: 'User1 yesterday plan',
        blockers: 'Some blocker',
        status: StandupStatus.SUBMITTED
      });
    });

    it('should find all standups without filters', async () => {
      const query: StandupQueryDto = {};
      const result = await standupRepository.findStandups(query) as StandupPaginatedResponseDto;

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by userId', async () => {
      const query: StandupQueryDto = {
        userId: testUser1.id
      };
      const result = await standupRepository.findStandups(query)  as StandupPaginatedResponseDto;

      expect(result.data).toHaveLength(2);
      expect(result.data.every(s => s.userId === testUser1.id)).toBe(true);
    });

    it('should filter by specific date', async () => {
      // Get the actual yesterday's date from the test data setup
      const actualYesterday = new Date();
      actualYesterday.setDate(actualYesterday.getDate() - 1);
      actualYesterday.setUTCHours(0, 0, 0, 0);
      const dateString = actualYesterday.toISOString().split('T')[0];

      const query: StandupQueryDto = {
        date: dateString
      };
      const result = await standupRepository.findStandups(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].yesterday).toBe('User1 yesterday work');
    });

    it('should filter by status', async () => {
      const query: StandupQueryDto = {
        status: StandupStatus.DRAFT
      };
      const result = await standupRepository.findStandups(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(StandupStatus.DRAFT);
    });

    it('should populate user information', async () => {
      const query: StandupQueryDto = {
        userId: testUser1.id,
        limit: 1
      };
      const result = await standupRepository.findStandups(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user).toBeDefined();
      expect(result.data[0].user?.name).toBe('Repo User 1');
      expect(result.data[0].user?.email).toBe('repo.user1@example.com');
    });

    it('should handle pagination correctly', async () => {
      const query: StandupQueryDto = {
        page: 1,
        limit: 2
      };
      const result = await standupRepository.findStandups(query);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should sort by date descending by default', async () => {
      const query: StandupQueryDto = {};
      const result = await standupRepository.findStandups(query);

      const dates = result.data.map(s => new Date(s.date).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
    });
  });

  describe('updateStandup', () => {
    it('should update standup fields', async () => {
      const standup = await standupRepository.createStandup(testUser1.id, {
        yesterday: 'Original work',
        today: 'Original plan',
        blockers: 'None',
        status: StandupStatus.DRAFT
      });

      const updated = await standupRepository.updateStandup(standup.id, {
        yesterday: 'Updated work',
        status: StandupStatus.SUBMITTED
      });

      expect(updated).toBeDefined();
      expect(updated?.yesterday).toBe('Updated work');
      expect(updated?.today).toBe('Original plan'); // Unchanged
      expect(updated?.status).toBe(StandupStatus.SUBMITTED);
      expect(updated?.updatedAt).not.toEqual(standup.updatedAt);
    });
  });
});
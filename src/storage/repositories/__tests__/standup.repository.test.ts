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
    it('should create a standup successfully', async () => {
      const standupData = {
        yesterday: 'Completed task A',
        today: 'Working on task B',
        blockers: 'None',
        status: StandupStatus.DRAFT
      };

      const result = await standupRepository.createStandup(testUser1.id, standupData);

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUser1.id);
      expect(result.yesterday).toBe('Completed task A');
      expect(result.today).toBe('Working on task B');
      expect(result.blockers).toBe('None');
      expect(result.status).toBe(StandupStatus.DRAFT);
      expect(result.createdAt).toBeDefined();
    });

    it('should create standup with automatic timestamp', async () => {
      const beforeCreate = new Date();
      
      const standupData = {
        yesterday: 'Default date test',
        today: 'Testing default date',
        blockers: 'None',
        status: StandupStatus.DRAFT
      };

      const result = await standupRepository.createStandup(testUser1.id, standupData);
      const afterCreate = new Date();

      expect(result).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('findStandups', () => {
    beforeEach(async () => {
      // Create test standups
      await standupRepository.createStandup(testUser1.id, {
        yesterday: 'User1 standup 1',
        today: 'User1 plan 1',
        blockers: 'None',
        status: StandupStatus.SUBMITTED
      });

      await standupRepository.createStandup(testUser2.id, {
        yesterday: 'User2 standup 1',
        today: 'User2 plan 1',
        blockers: 'None',
        status: StandupStatus.DRAFT
      });

      await standupRepository.createStandup(testUser1.id, {
        yesterday: 'User1 standup 2',
        today: 'User1 plan 2',
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

    it('should filter by date range using createdAt', async () => {
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];

      const query: StandupQueryDto = {
        date: dateString
      };
      const result = await standupRepository.findStandups(query);

      // Should find all standups created today
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(s => s.createdAt)).toBe(true);
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

    it('should sort by createdAt descending by default', async () => {
      const query: StandupQueryDto = {};
      const result = await standupRepository.findStandups(query);

      const dates = result.data.map(s => new Date(s.createdAt).getTime());
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
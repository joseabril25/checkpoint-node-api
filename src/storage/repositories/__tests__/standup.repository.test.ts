import { StandupStatus } from '../../../models/';
import { StandupQueryDto } from '../../../types';
import { standupRepository } from '../standup.repository';
import { userRepository } from '../user.repository';

describe('StandupRepository', () => {
  let userId: string;
  let anotherUserId: string;

  // Create test users before tests
  beforeEach(async () => {
    const user = await userRepository.create({
      email: 'standup.user@example.com',
      password: 'Password123!',
      name: 'Standup Test User',
      timezone: 'America/New_York'
    });
    userId = user.id;

    const anotherUser = await userRepository.create({
      email: 'another.user@example.com', 
      password: 'Password123!',
      name: 'Another User',
      timezone: 'America/New_York'
    });
    anotherUserId = anotherUser.id;
  });

  describe('createOrUpdateDraft', () => {
    it('should create a new draft standup', async () => {
      const today = new Date();
      const standupData = {
        yesterday: 'Started working on auth module',
        today: 'Continue with auth implementation',
        blockers: 'None',
        status: StandupStatus.DRAFT
      };

      const standup = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        standupData
      );

      expect(standup).toBeDefined();
      expect(standup.id).toBeDefined();
      expect(standup.userId.toString()).toBe(userId);
      expect(standup.yesterday).toBe(standupData.yesterday);
      expect(standup.today).toBe(standupData.today);
      expect(standup.blockers).toBe(standupData.blockers);
      expect(standup.status).toBe(StandupStatus.DRAFT);
      
      // Check date is normalized to start of day
      expect(standup.date.getUTCHours()).toBe(0);
      expect(standup.date.getUTCMinutes()).toBe(0);
      expect(standup.date.getUTCSeconds()).toBe(0);
    });

    it('should create a submitted standup', async () => {
      const today = new Date();
      const standupData = {
        yesterday: 'Completed auth module',
        today: 'Starting on standup features',
        blockers: 'Need API documentation review',
        status: StandupStatus.SUBMITTED
      };

      const standup = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        standupData
      );

      expect(standup.status).toBe(StandupStatus.SUBMITTED);
      expect(standup.blockers).toBe(standupData.blockers);
    });

    it('should update existing draft to submitted', async () => {
      const today = new Date();
      
      // First create as draft
      const draft = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        {
          yesterday: 'Draft yesterday',
          today: 'Draft today',
          blockers: '',
          status: StandupStatus.DRAFT
        }
      );

      expect(draft.status).toBe(StandupStatus.DRAFT);

      // Update to submitted with new content
      const submitted = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        {
          yesterday: 'Completed authentication module and tests',
          today: 'Working on standup API endpoints',
          blockers: 'Waiting for code review',
          status: StandupStatus.SUBMITTED
        }
      );

      expect(submitted.id).toBe(draft.id); // Same document
      expect(submitted.status).toBe(StandupStatus.SUBMITTED);
      expect(submitted.yesterday).toBe('Completed authentication module and tests');
      expect(submitted.today).toBe('Working on standup API endpoints');
      expect(submitted.blockers).toBe('Waiting for code review');
      expect(submitted.updatedAt.getTime()).toBeGreaterThan(draft.updatedAt.getTime());
    });

    it('should enforce one standup per user per day', async () => {
      const today = new Date();
      
      // Create first standup
      const first = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        {
          yesterday: 'First entry',
          today: 'First plan',
          status: StandupStatus.SUBMITTED
        }
      );

      // Try to create another - should update instead
      const second = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        {
          yesterday: 'Second entry',
          today: 'Second plan',
          status: StandupStatus.SUBMITTED
        }
      );

      expect(second.id).toBe(first.id); // Same document
      expect(second.yesterday).toBe('Second entry'); // Updated content
    });

    it('should allow different users to have standups on same day', async () => {
      const today = new Date();
      
      const standup1 = await standupRepository.createOrUpdateDraft(
        userId,
        today,
        {
          yesterday: 'User 1 work',
          today: 'User 1 plan',
          status: StandupStatus.SUBMITTED
        }
      );

      const standup2 = await standupRepository.createOrUpdateDraft(
        anotherUserId,
        today,
        {
          yesterday: 'User 2 work',
          today: 'User 2 plan',
          status: StandupStatus.SUBMITTED
        }
      );

      expect(standup1.id).not.toBe(standup2.id);
      expect(standup1.userId.toString()).toBe(userId);
      expect(standup2.userId.toString()).toBe(anotherUserId);
    });
  });

  describe('findByUserAndDate', () => {
    it('should find standup for specific user and date', async () => {
      const specificDate = new Date('2025-07-20');
      
      await standupRepository.createOrUpdateDraft(
        userId,
        specificDate,
        {
          yesterday: 'Specific date work',
          today: 'Specific date plan',
          status: StandupStatus.SUBMITTED
        }
      );

      const filters = {
        userId,
        date: specificDate // YYYY-MM-DD format
      }

      const found = await standupRepository.findStandups(filters);
      
      expect(found).toBeDefined();
      expect(found?.data[0]?.yesterday).toBe('Specific date work');
    });

    it('should return null for non-existent standup', async () => {
      const filters: StandupQueryDto = {
        userId,
        date: new Date('2025-12-31')
      };
      const found = await standupRepository.findStandups(filters);

      expect(found.data.length).toBe(0);
    });
  });

  describe('findStandups - Team View', () => {
    beforeEach(async () => {
      // Create standups for today
      const today = new Date();
      
      await standupRepository.createOrUpdateDraft(userId, today, {
        yesterday: 'User 1 completed auth',
        today: 'User 1 working on tests',
        blockers: 'None',
        status: StandupStatus.SUBMITTED
      });

      await standupRepository.createOrUpdateDraft(anotherUserId, today, {
        yesterday: 'User 2 fixed bugs',
        today: 'User 2 implementing features',
        blockers: 'Waiting for API specs',
        status: StandupStatus.SUBMITTED
      });

      // Create a draft (should not appear in team view)
      const thirdUser = await userRepository.create({
        email: 'third@example.com',
        password: 'Password123!',
        name: 'Third User',
        timezone: 'UTC'
      });

      await standupRepository.createOrUpdateDraft(thirdUser.id, today, {
        yesterday: 'Draft work',
        today: 'Draft plan',
        status: StandupStatus.DRAFT
      });
    });

    it('should get all submitted standups for today', async () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const result = await standupRepository.findStandups({
        date: today,
        status: StandupStatus.SUBMITTED
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      
      // Should populate user data
      expect(result.data[0].userId).toHaveProperty('name');
      expect(result.data[0].userId).toHaveProperty('email');
      
      // Should not include drafts
      expect(result.data.every(s => s.status === StandupStatus.SUBMITTED)).toBe(true);
    });

    it('should get standups for specific date', async () => {
      // Create standups for different date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await standupRepository.createOrUpdateDraft(userId, yesterday, {
        yesterday: 'Previous day work',
        today: 'Previous day plan',
        status: StandupStatus.SUBMITTED
      });

      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const result = await standupRepository.findStandups({
        date: yesterdayStr,
        status: StandupStatus.SUBMITTED
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].yesterday).toBe('Previous day work');
    });
  });

  describe('findStandups - History View', () => {
    beforeEach(async () => {
      // Create multiple standups for user over several days
      const dates = [0, 1, 2, 3, 4, 5, 6].map(daysAgo => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
      });

      for (const date of dates) {
        await standupRepository.createOrUpdateDraft(userId, date, {
          yesterday: `Work on ${date.toDateString()}`,
          today: `Plan for ${date.toDateString()}`,
          blockers: `Blockers for ${date.toDateString()}`,
          status: StandupStatus.SUBMITTED
        });
      }
    });

    it('should get user history with pagination', async () => {
      const result = await standupRepository.findStandups({
        userId,
        page: 1,
        limit: 5,
        sort: 'date',
        order: 'desc'
      });

      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(7);
      
      // Check sorting (newest first)
      const dates = result.data.map(s => s.date.getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should get second page of results', async () => {
      const result = await standupRepository.findStandups({
        userId,
        page: 2,
        limit: 5,
        sort: 'date',
        order: 'desc'
      });

      expect(result.data).toHaveLength(2); // Remaining 2 items
      expect(result.total).toBe(7);
    });

    it('should filter by status', async () => {
      // Create some drafts
      const today = new Date();
      await standupRepository.createOrUpdateDraft(anotherUserId, today, {
        yesterday: 'Draft yesterday',
        today: 'Draft today',
        status: StandupStatus.DRAFT
      });

      const drafts = await standupRepository.findStandups({
        status: StandupStatus.DRAFT
      });

      expect(drafts.data.every(s => s.status === StandupStatus.DRAFT)).toBe(true);
    });
  });

  describe('findStandups - Date Range Queries', () => {
    beforeEach(async () => {
      // Create standups for a week
      const dates = ['2025-07-16', '2025-07-17', '2025-07-18', '2025-07-19', '2025-07-20'];
      
      for (const dateStr of dates) {
        await standupRepository.createOrUpdateDraft(
          userId,
          new Date(dateStr),
          {
            yesterday: `Work on ${dateStr}`,
            today: `Plan for ${dateStr}`,
            status: StandupStatus.SUBMITTED
          }
        );
      }
    });

    it('should get standups within date range', async () => {
      const result = await standupRepository.findStandups({
        dateFrom: '2025-07-16',
        dateTo: '2025-07-18'
      });

      expect(result.data).toHaveLength(3);
      const dates = result.data.map(s => s.date.toISOString().split('T')[0]);
      expect(dates).toContain('2025-07-16');
      expect(dates).toContain('2025-07-17');
      expect(dates).toContain('2025-07-18');
    });

    it('should handle open-ended date ranges', async () => {
      // From date only
      const fromResult = await standupRepository.findStandups({
        dateFrom: '2025-07-16'
      });
      expect(fromResult.data.length).toBeGreaterThanOrEqual(1);

      // To date only
      const toResult = await standupRepository.findStandups({
        dateTo: '2025-07-18'
      });
      expect(toResult.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findStandups - Complex Filters', () => {
    it('should combine multiple filters', async () => {
      const today = new Date();
      
      // Create mix of standups
      await standupRepository.createOrUpdateDraft(userId, today, {
        yesterday: 'User 1 submitted',
        today: 'User 1 plan',
        status: StandupStatus.SUBMITTED
      });

      await standupRepository.createOrUpdateDraft(anotherUserId, today, {
        yesterday: 'User 2 draft',
        today: 'User 2 plan',
        status: StandupStatus.DRAFT
      });

      // Query: specific user + date + status
      const result = await standupRepository.findStandups({
        userId,
        date: today.toISOString().split('T')[0],
        status: StandupStatus.SUBMITTED
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].userId._id.toString()).toBe(userId);
      expect(result.data[0].status).toBe(StandupStatus.SUBMITTED);
    });

    it('should handle empty results gracefully', async () => {
      const result = await standupRepository.findStandups({
        date: '2099-12-31'
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
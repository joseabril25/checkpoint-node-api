import { BaseRepository } from './base.repository';
import { Standup, IStandup } from '../../models';
import { StandupQueryDto } from '@/types';
import { FilterQuery } from 'mongoose';

export class StandupRepository extends BaseRepository<IStandup> {
  constructor() {
    super(Standup);
  }

  async findStandups(query: StandupQueryDto): Promise<{
    data: IStandup[];
    total: number;
  }> {
    const {
      userId,
      date,
      dateFrom,
      dateTo,
      status,
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc'
    } = query;

    // Build filter
    const filter: FilterQuery<IStandup> = {};

    // User filter
    if (userId) {
      filter.userId = userId;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date filtering
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        const start = new Date(dateFrom);
        start.setUTCHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sort]: sortOrder })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email profileImage')
        .exec(),
      this.model.countDocuments(filter).exec()
    ]);

    return { data, total };
  }

  // Keep only the special methods
  async createOrUpdateDraft(userId: string, date: Date, data: Partial<IStandup>): Promise<IStandup> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    return this.model.findOneAndUpdate(
      { userId, date: startOfDay },
      { ...data, userId, date: startOfDay },
      { new: true, upsert: true, runValidators: true }
    ).exec() as Promise<IStandup>;
  }
}

export const standupRepository = new StandupRepository();
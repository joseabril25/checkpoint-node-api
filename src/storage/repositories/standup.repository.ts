import { BaseRepository } from './base.repository';
import { Standup, IStandup } from '../../models';
import { CreateStandupDto, StandupQueryDto, StandupResponseDto, UpdateStandupDto, StandupPaginatedResponseDto } from '@/types';
import { FilterQuery } from 'mongoose';

export class StandupRepository extends BaseRepository<IStandup> {
  constructor() {
    super(Standup);
  }

  async findStandups(query: StandupQueryDto): Promise<StandupPaginatedResponseDto> {
    const {
      userId,
      date,
      dateFrom,
      dateTo,
      status,
      page = 1,
      limit = 10,
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

    const [rawData, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sort]: sortOrder })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'name email profileImage')
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec()
    ]);

    // Transform raw mongoose documents to StandupResponseDto format
    const data: StandupResponseDto[] = rawData.map((standup: any) => ({
      id: standup._id.toString(),
      userId: standup.userId?._id?.toString() || standup.userId?.toString() || '',
      date: standup.date,
      yesterday: standup.yesterday,
      today: standup.today,
      blockers: standup.blockers,
      status: standup.status,
      createdAt: standup.createdAt,
      updatedAt: standup.updatedAt,
      user: (standup.userId && typeof standup.userId === 'object' && standup.userId._id) ? {
        id: standup.userId._id.toString(),
        name: standup.userId.name,
        email: standup.userId.email,
        profileImage: standup.userId.profileImage || undefined
      } : undefined
    }));

    // Return complete StandupPaginatedResponseDto
    return {
      data,
      pagination: {
        page: page!,
        limit: limit!,
        total,
        totalPages: Math.ceil(total / limit!),
        hasMore: page! < Math.ceil(total / limit!)
      }
    };
  }

  async createStandup(userId: string, data: CreateStandupDto): Promise<IStandup> {
    const standupData = {
      ...data,
      userId,
      date: data.date || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(standupData as IStandup); // Uses base repository
  }

  async updateStandup(standupId: string, data: UpdateStandupDto): Promise<IStandup | null> {
    return this.update(standupId, {
      ...data,
      updatedAt: new Date()
    }); // Uses base repository
  }
}

export const standupRepository = new StandupRepository();
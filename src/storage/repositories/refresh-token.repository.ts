import { BaseRepository } from './base.repository';
import { RefreshToken, IRefreshToken } from '../../models';
import { CreateRefreshTokenDto } from '../../types';
import { Types } from 'mongoose';

export class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshToken);
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return this.model.findOne({ 
      token,
      expiresAt: { $gt: new Date() }
    }).exec();
  }

  async findUserTokens(userId: string): Promise<IRefreshToken[]> {
    return this.find({ 
      userId,
      expiresAt: { $gt: new Date() }
    });
  }

  async createToken(data: CreateRefreshTokenDto): Promise<IRefreshToken> {
    return this.create({
      ...data,
      userId: new Types.ObjectId(data.userId) as any
    });
  }

  async invalidateToken(token: string): Promise<boolean> {
    const result = await this.model.deleteOne({ token }).exec();
    return result.deletedCount > 0;
  }

  async invalidateAllUserTokens(userId: string): Promise<number> {
    const result = await this.model.deleteMany({ userId }).exec();
    return result.deletedCount;
  }

  async updateLastUsed(token: string): Promise<IRefreshToken | null> {
    return this.model.findOneAndUpdate(
      { token },
      { lastUsedAt: new Date() },
      { new: true }
    ).exec();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
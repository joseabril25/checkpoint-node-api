import { User, IUser } from '../../models';
import { UserStatus } from '../../models/user.model';
import { CreateUserDto, UpdateUserDto } from '../../types';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {;
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findActiveUsers(): Promise<IUser[]> {
    return this.find({ status: UserStatus.ACTIVE });
  }

  async createUser(data: CreateUserDto): Promise<IUser> {
    return this.create(data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<IUser | null> {
    return this.update(id, data);
  }

  async softDelete(id: string): Promise<IUser | null> {
    return this.update(id, { status: 'inactive' });
  }

  async findByIdWithoutPassword(id: string): Promise<IUser | null> {
    return this.model.findById(id).select('-password').exec();
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
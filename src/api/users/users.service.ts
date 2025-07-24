import { UserRepository } from "@/storage/repositories";
import { IUser } from "@/models";

export class UserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }

  getAllUsers = async (): Promise<IUser[]> => {
    return this.userRepository.findActiveUsers();
  }
}
import { UserRepository } from "../../storage/repositories";
import { CreateUserDto } from "../../types";


export class AuthService {
  private userRepository: UserRepository
  // Define methods for user registration, login, etc.
  constructor() {
    // initialize user repository here
    this.userRepository = new UserRepository();

  }
  async registerUser(registerDto: CreateUserDto): Promise<any> {
    const user = await this.userRepository.createUser(registerDto)
    return user // Placeholder response
  }
}
import { JwtUtils } from "../../common/utils";
import { UserRepository, RefreshTokenRepository } from "../../storage/repositories";
import { CreateUserDto, LoginDto, AuthResponseDto, UserResponseDto } from "../../types";
import createError from 'http-errors';

export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
  }

  async register(userData: CreateUserDto): Promise<AuthResponseDto> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw createError(409, 'User already exists');
    }

    // Create user
    const user = await this.userRepository.create(userData);
    
    // Generate tokens
    const accessToken = JwtUtils.generateAccessToken(user.id, user.email);
    const refreshToken = JwtUtils.generateRefreshToken();

    // Save refresh token
    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Build UserResponseDto
    const userResponse: UserResponseDto = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      profileImage: user.profileImage,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  async login(loginData: LoginDto): Promise<AuthResponseDto> {
    // Find user with password field
    const user = await this.userRepository.findByEmailWithPassword(loginData.email);
    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    // Check password
    const isValidPassword = await user.comparePassword(loginData.password);
    if (!isValidPassword) {
      throw createError(401, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = JwtUtils.generateAccessToken(user.id, user.email);
    const refreshToken = JwtUtils.generateRefreshToken();

    // Save refresh token
    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Build UserResponseDto
    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      profileImage: user.profileImage,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.invalidateToken(refreshToken);
  }

  async refreshToken(oldRefreshToken: string): Promise<Omit<AuthResponseDto, 'user'>> {
    // Verify and get refresh token from DB
    const tokenDoc = await this.refreshTokenRepository.findByToken(oldRefreshToken);
    if (!tokenDoc) {
      throw createError(401, 'Invalid refresh token');
    }

    // Check if expired
    if (new Date() > tokenDoc.expiresAt) {
      await this.refreshTokenRepository.invalidateToken(oldRefreshToken);
      throw createError(401, 'Refresh token expired');
    }

    // Get user
    const user = await this.userRepository.findById(tokenDoc.userId.toString());
    if (!user) {
      throw createError(404, 'User not found');
    }

    // Generate new tokens
    const accessToken = JwtUtils.generateAccessToken(user.id, user.email);
    const refreshToken = JwtUtils.generateRefreshToken();

    // Delete old refresh token and save new one
    await this.refreshTokenRepository.invalidateToken(oldRefreshToken);
    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return {
      accessToken,
      refreshToken
    };
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.invalidateAllUserTokens(userId);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithoutPassword(userId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      profileImage: user.profileImage,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
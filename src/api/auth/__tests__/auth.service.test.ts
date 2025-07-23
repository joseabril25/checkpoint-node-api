import { AuthService } from '../auth.service';
import { JwtUtils } from '../../../common/utils';
import { CreateUserDto, LoginDto } from '../../../types';
import { User } from '../../../models';

// Mock JWT utilities only (we'll use real database)
jest.mock('../../../common/utils/jwt.utils');

describe('AuthService Integration Tests', () => {
  let authService: AuthService;

  // Test data
  const testUserData: CreateUserDto = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    timezone: 'UTC'
  };

  const testLoginData: LoginDto = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT utils with unique tokens
    (JwtUtils.generateAccessToken as jest.Mock).mockReturnValue(mockTokens.accessToken);
    (JwtUtils.generateRefreshToken as jest.Mock).mockImplementation(() => 
      `mock-refresh-token-${Date.now()}-${Math.random()}`
    );

    authService = new AuthService();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Act
      const result = await authService.register(testUserData);

      // Assert
      expect(JwtUtils.generateAccessToken).toHaveBeenCalledWith(expect.any(String), testUserData.email);
      expect(JwtUtils.generateRefreshToken).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          id: expect.any(String),
          email: testUserData.email,
          name: testUserData.name,
          timezone: testUserData.timezone,
          profileImage: null,
          status: 'active',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        },
        accessToken: mockTokens.accessToken,
        refreshToken: expect.stringContaining('mock-refresh-token-')
      });

      // Verify user exists in database
      const createdUser = await User.findOne({ email: testUserData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.email).toBe(testUserData.email);
      expect(createdUser?.name).toBe(testUserData.name);
    });

    it('should throw error if user already exists', async () => {
      // Arrange - create user first
      await authService.register(testUserData);

      // Act & Assert
      await expect(authService.register(testUserData))
        .rejects
        .toMatchObject({
          status: 409,
          message: expect.any(String)
        });
    });

    it('should hash the password', async () => {
      // Act
      await authService.register(testUserData);

      // Assert
      const createdUser = await User.findOne({ email: testUserData.email }).select('+password');
      expect(createdUser?.password).toBeDefined();
      expect(createdUser?.password).not.toBe(testUserData.password); // Should be hashed
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a user to login with
      await authService.register(testUserData);
    });

    it('should successfully login with valid credentials', async () => {
      // Act
      const result = await authService.login(testLoginData);

      // Assert
      expect(JwtUtils.generateAccessToken).toHaveBeenCalledWith(expect.any(String), testLoginData.email);
      expect(JwtUtils.generateRefreshToken).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          id: expect.any(String),
          email: testLoginData.email,
          name: testUserData.name,
          timezone: testUserData.timezone,
          profileImage: null,
          status: 'active',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        },
        accessToken: mockTokens.accessToken,
        refreshToken: expect.stringContaining('mock-refresh-token-')
      });
    });

    it('should throw error if user not found', async () => {
      // Act & Assert
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      }))
        .rejects
        .toMatchObject({
          status: 401,
          message: expect.any(String)
        });
    });

    it('should throw error if password is invalid', async () => {
      // Act & Assert
      await expect(authService.login({
        email: testLoginData.email,
        password: 'wrongpassword'
      }))
        .rejects
        .toMatchObject({
          status: 401,
          message: expect.any(String)
        });
    });

    it('should use real password comparison', async () => {
      // This test verifies that bcrypt comparison is working
      const result = await authService.login(testLoginData);
      
      expect(result).toBeDefined();
      expect(result.user.email).toBe(testLoginData.email);
    });
  });
});
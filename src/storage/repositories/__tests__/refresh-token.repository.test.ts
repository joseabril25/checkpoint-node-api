// src/storage/repositories/__tests__/refresh-token.repository.test.ts
import { CreateRefreshTokenDto } from '../../../types';
import { refreshTokenRepository } from '../refresh-token.repository';
import { userRepository } from '../user.repository';


describe('RefreshTokenRepository', () => {
  let userId: string;
  let testUser: any;

  // Create a test user before all refresh token tests
  beforeEach(async () => {
    testUser = await userRepository.create({
      email: 'tokentest@example.com',
      password: 'Password123!',
      name: 'Token Test User',
      timezone: 'UTC'
    });
    userId = testUser.id;
  });

  describe('create', () => {
    it('should create a refresh token', async () => {
      const tokenData: CreateRefreshTokenDto = {
        userId,
        token: 'hashed-refresh-token-123',
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      const refreshToken = await refreshTokenRepository.create(tokenData);

      expect(refreshToken).toBeDefined();
      expect(refreshToken.id).toBeDefined();
      expect(refreshToken.userId.toString()).toBe(userId);
      expect(refreshToken.token).toBe(tokenData.token);
      expect(refreshToken.userAgent).toBe(tokenData.userAgent);
      expect(refreshToken.ipAddress).toBe(tokenData.ipAddress);
      expect(refreshToken.expiresAt).toBeInstanceOf(Date);
      expect(refreshToken.createdAt).toBeInstanceOf(Date);
    });

    it('should create token without optional fields', async () => {
      const minimalTokenData: CreateRefreshTokenDto = {
        userId,
        token: 'minimal-token',
        expiresAt: new Date(Date.now() + 1000000)
      };

      const refreshToken = await refreshTokenRepository.create(minimalTokenData);

      expect(refreshToken).toBeDefined();
      expect(refreshToken.userAgent).toBeNull();
      expect(refreshToken.ipAddress).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should find valid (non-expired) token', async () => {
      const token = await refreshTokenRepository.create({
        userId,
        token: 'valid-token-123',
        expiresAt: new Date(Date.now() + 1000000) // Future date
      });

      const found = await refreshTokenRepository.findByToken('valid-token-123');

      expect(found).toBeDefined();
      expect(found?.id).toBe(token.id);
      expect(found?.userId.toString()).toBe(userId);
    });

    it('should not find expired token', async () => {
      await refreshTokenRepository.create({
        userId,
        token: 'expired-token-123',
        expiresAt: new Date(Date.now() - 1000) // Past date
      });

      const found = await refreshTokenRepository.findByToken('expired-token-123');

      expect(found).toBeNull();
    });

    it('should return null for non-existent token', async () => {
      const found = await refreshTokenRepository.findByToken('non-existent-token');
      expect(found).toBeNull();
    });
  });

  describe('findUserTokens', () => {
    it('should find all valid tokens for a user', async () => {
      // Create multiple tokens
      await refreshTokenRepository.create({
        userId,
        token: 'token-1',
        expiresAt: new Date(Date.now() + 1000000)
      });
      
      await refreshTokenRepository.create({
        userId,
        token: 'token-2',
        expiresAt: new Date(Date.now() + 2000000)
      });
      
      // Create expired token (should not be returned)
      await refreshTokenRepository.create({
        userId,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000)
      });

      const tokens = await refreshTokenRepository.findUserTokens(userId);

      expect(tokens).toHaveLength(2);
      expect(tokens.every(t => t.userId.toString() === userId)).toBe(true);
      expect(tokens.find(t => t.token === 'expired-token')).toBeUndefined();
    });

    it('should return empty array for user with no tokens', async () => {
      const newUser = await userRepository.create({
        email: 'notoken@example.com',
        password: 'Password123!',
        name: 'No Token User',
        timezone: 'UTC'
      });

      const tokens = await refreshTokenRepository.findUserTokens(newUser.id);
      expect(tokens).toEqual([]);
    });
  });

  describe('invalidateToken', () => {
    it('should delete a specific token', async () => {
      await refreshTokenRepository.create({
        userId,
        token: 'token-to-delete',
        expiresAt: new Date(Date.now() + 1000000)
      });

      const deleted = await refreshTokenRepository.invalidateToken('token-to-delete');
      expect(deleted).toBe(true);

      // Verify it's gone
      const found = await refreshTokenRepository.findByToken('token-to-delete');
      expect(found).toBeNull();
    });

    it('should return false for non-existent token', async () => {
      const deleted = await refreshTokenRepository.invalidateToken('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('should delete all tokens for a user', async () => {
      // Create multiple tokens
      await refreshTokenRepository.create({
        userId,
        token: 'user-token-1',
        expiresAt: new Date(Date.now() + 1000000)
      });
      
      await refreshTokenRepository.create({
        userId,
        token: 'user-token-2',
        expiresAt: new Date(Date.now() + 2000000)
      });

      const deletedCount = await refreshTokenRepository.invalidateAllUserTokens(userId);
      expect(deletedCount).toBe(2);

      // Verify all are gone
      const remaining = await refreshTokenRepository.findUserTokens(userId);
      expect(remaining).toHaveLength(0);
    });

    it('should return 0 for user with no tokens', async () => {
      const newUser = await userRepository.create({
        email: 'notokens@example.com',
        password: 'Password123!',
        name: 'Another User',
        timezone: 'UTC'
      });

      const deletedCount = await refreshTokenRepository.invalidateAllUserTokens(newUser.id);
      expect(deletedCount).toBe(0);
    });

    it('should not affect other users tokens', async () => {
      // Create token for another user
      const anotherUser = await userRepository.create({
        email: 'another@example.com',
        password: 'Password123!',
        name: 'Another User',
        timezone: 'UTC'
      });

      await refreshTokenRepository.create({
        userId: anotherUser.id,
        token: 'another-user-token',
        expiresAt: new Date(Date.now() + 1000000)
      });

      // Delete first user's tokens
      await refreshTokenRepository.invalidateAllUserTokens(userId);

      // Check other user's token still exists
      const found = await refreshTokenRepository.findByToken('another-user-token');
      expect(found).toBeDefined();
    });
  });
});
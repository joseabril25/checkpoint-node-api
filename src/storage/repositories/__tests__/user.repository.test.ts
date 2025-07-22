import { CreateUserDto, UpdateUserDto } from '../../../types';
import { userRepository } from '../user.repository';


describe('UserRepository', () => {
  // Test data
  const validUserData: CreateUserDto = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
    timezone: 'Auckland/Auckland',
  };

  // Helper to create a user with unique email
  const createTestUser = async (emailSuffix = '') => {
    const email = emailSuffix ? `test${emailSuffix}@example.com` : validUserData.email;
    return userRepository.create({
      ...validUserData,
      email
    });
  };

  describe('create', () => {
    it('should create a new user with all fields', async () => {
      const user = await userRepository.create(validUserData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(validUserData.email);
      expect(user.name).toBe(validUserData.name);
      expect(user.timezone).toBe(validUserData.timezone);
      expect(user.status).toBe('active'); // Default status
      expect(user.password).not.toBe(validUserData.password); // Should be hashed
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should lowercase email addresses', async () => {
      const user = await userRepository.create({
        ...validUserData,
        email: 'TEST@EXAMPLE.COM'
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should throw error for duplicate email', async () => {
      await createTestUser();
      
      await expect(createTestUser()).rejects.toThrow();
    });

    it('should hash password before saving', async () => {
      const user = await createTestUser('hash');
      
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(validUserData.password);
      expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash length
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (case insensitive)', async () => {
      const created = await createTestUser('find');
      
      const found = await userRepository.findByEmail('testfind@example.com');
      const foundUpperCase = await userRepository.findByEmail('TESTFIND@EXAMPLE.COM');

      expect(found?.id).toBe(created.id);
      expect(foundUpperCase?.id).toBe(created.id);
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should not include password by default', async () => {
      await createTestUser('nopass');
      
      const found = await userRepository.findByEmail('testnopass@example.com');
      expect(found?.password).toBeUndefined();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should include password field', async () => {
      await createTestUser('withpass');
      
      const found = await userRepository.findByEmailWithPassword('testwithpass@example.com');
      
      expect(found).toBeDefined();
      expect(found?.password).toBeDefined();
      expect(found?.password).not.toBe(validUserData.password); // Should be hashed
    });

    it('should return null for non-existent email', async () => {
      const found = await userRepository.findByEmailWithPassword('notfound@example.com');
      expect(found).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const created = await createTestUser('byid');
      
      const found = await userRepository.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(created.email);
    });

    it('should return null for invalid ID', async () => {
      const found = await userRepository.findById('507f1f77bcf86cd799439011'); // Valid ObjectId format but doesn't exist
      expect(found).toBeNull();
    });

    it('should throw error for malformed ID', async () => {
      await expect(userRepository.findById('invalid-id')).rejects.toThrow();
    });
  });

  describe('findByIdWithoutPassword', () => {
    it('should exclude password field', async () => {
      const created = await createTestUser('nopassbyid');
      
      const found = await userRepository.findByIdWithoutPassword(created.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.password).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update allowed fields', async () => {
      const user = await createTestUser('update');
      
      const updateData: UpdateUserDto = {
        name: 'Updated Name',
        timezone: 'Europe/London',
        profileImage: 'https://example.com/avatar.jpg'
      };
      
      const updated = await userRepository.updateUser(user.id, updateData);
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updateData.name);
      expect(updated?.timezone).toBe(updateData.timezone);
      expect(updated?.profileImage).toBe(updateData.profileImage);
      expect(updated?.email).toBe(user.email); // Email should not change
    });

    it('should return null for non-existent user', async () => {
      const updated = await userRepository.updateUser(
        '507f1f77bcf86cd799439011',
        { name: 'New Name' }
      );
      
      expect(updated).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should set user status to inactive', async () => {
      const user = await createTestUser('delete');
      expect(user.status).toBe('active');
      
      const deleted = await userRepository.softDelete(user.id);
      
      expect(deleted).toBeDefined();
      expect(deleted?.status).toBe('inactive');
      expect(deleted?.id).toBe(user.id);
    });

    it('should return null for non-existent user', async () => {
      const deleted = await userRepository.softDelete('507f1f77bcf86cd799439011');
      expect(deleted).toBeNull();
    });
  });

  describe('findActiveUsers', () => {
    it('should only return active users', async () => {
      // Create mix of active and inactive users
      const active1 = await createTestUser('active1');
      const active2 = await createTestUser('active2');
      const inactive = await createTestUser('inactive');
      
      // Soft delete one user
      await userRepository.softDelete(inactive.id);
      
      const activeUsers = await userRepository.findActiveUsers();
      
      expect(activeUsers.length).toBe(2);
      expect(activeUsers.find(u => u.id === active1.id)).toBeDefined();
      expect(activeUsers.find(u => u.id === active2.id)).toBeDefined();
      expect(activeUsers.find(u => u.id === inactive.id)).toBeUndefined();
    });

    it('should return empty array when no active users', async () => {
      const users = await userRepository.findActiveUsers();
      expect(users).toEqual([]);
    });
  });

  describe('password comparison', () => {
    it('should validate correct password', async () => {
      await createTestUser('passcheck');
      
      const user = await userRepository.findByEmailWithPassword('testpasscheck@example.com');
      expect(user).toBeDefined();
      
      const isValid = await user!.comparePassword(validUserData.password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      await createTestUser('wrongpass');
      
      const user = await userRepository.findByEmailWithPassword('testwrongpass@example.com');
      expect(user).toBeDefined();
      
      const isValid = await user!.comparePassword('WrongPassword123!');
      expect(isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in data', async () => {
      const specialUser = await userRepository.create({
        email: 'special+test@example.com',
        password: 'P@ssw0rd!#$%',
        name: "O'Brien-Smith",
        timezone: 'America/New_York'
      });
      
      expect(specialUser.email).toBe('special+test@example.com');
      expect(specialUser.name).toBe("O'Brien-Smith");
    });

    it('should enforce email validation', async () => {
      await expect(userRepository.create({
        ...validUserData,
        email: 'invalid-email'
      })).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      await expect(userRepository.create({
        ...validUserData,
        password: 'short'
      })).rejects.toThrow();
    });
  });
});
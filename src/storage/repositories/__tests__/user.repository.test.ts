import { userRepository } from '../user.repository';

const userData = {
  email: 'testuser@example.com',
  password: 'Password123!',
  name: 'Test User',
  timezone: 'UTC',  // Default timezone
  status: 'active', // Default status
};

const createUser = async (email: string, password: string, name: string, timezone: string) => {
  return await userRepository.create({
    email,
    password,
    name,
    timezone,
  });
};

describe('UserRepository', () => {
  it('should connect to test database', async () => {
    // Simple test to verify setup works
    const users = await userRepository.find();
    expect(users).toEqual([]);
  });

  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      timezone: 'UTC'
    };

    const user = await userRepository.create(userData);
    
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should find a user by email', async () => {
    const createdUser = await createUser(
      userData.email,
      userData.password,
      userData.name,
      userData.timezone
    );

    const foundUser = await userRepository.findOne({ email: userData.email });
    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(userData.email);
  });
});
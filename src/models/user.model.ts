import { Document } from "mongoose";

export interface IUser extends Document {
  email: string; // Unique email for user authentication              
  password: string; // Hashed password for security 
  name: string;               
  profileImage?: string;
  timezone: string; // e.g., "Auckland/Auckland"
  status: string; // e.g., "active", "inactive"
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword: (candidatePassword: string) => Promise<boolean>; // Method to compare password
  toJSON(): Omit<IUser, 'password'>; // Method to return user data without password
}
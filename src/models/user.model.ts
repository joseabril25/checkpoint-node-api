import { Document, model, Schema } from "mongoose";
import bcrypt from 'bcryptjs';

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
  comparePassword: (candidatePassword: string) => Promise<boolean>; // Method to compare password for login
}


const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Exclude password from queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  profileImage: {
    type: String,
    default: null,
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'UTC',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
});

userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Implement password comparison logic here, e.g., using bcrypt
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
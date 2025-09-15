import mongoose, { Document } from 'mongoose';

interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'blocked';
  isActive: boolean;
  passwordResetRequest?: {
    requested: boolean;
    requestedAt?: Date | null;
    approved: boolean;
    approvedAt?: Date | null;
    approvedBy?: mongoose.Types.ObjectId | null;
  };
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
import { hashPassword } from '@/lib/auth';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    passwordResetRequest: {
      requested: {
        type: Boolean,
        default: false,
      },
      requestedAt: {
        type: Date,
      },
      approved: {
        type: Boolean,
        default: false,
      },
      approvedAt: {
        type: Date,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

// Use a more robust model export for production stability
let User: mongoose.Model<IUser>;

try {
  User = mongoose.model<IUser>('User');
} catch {
  User = mongoose.model<IUser>('User', userSchema);
}

export default User;

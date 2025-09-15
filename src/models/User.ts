import mongoose from 'mongoose';
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
let User: mongoose.Model<any>;

try {
  User = mongoose.model('User');
} catch (error) {
  User = mongoose.model('User', userSchema);
}

export default User;

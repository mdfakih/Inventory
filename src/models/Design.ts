import mongoose, { Document } from 'mongoose';

interface IDesign extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  number: string;
  imageUrl?: string;
  prices: Array<{
    currency: '₹' | '$';
    price: number;
  }>;
  defaultStones: Array<{
    stoneId: mongoose.Types.ObjectId;
    quantity: number;
  }>;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  updateHistory: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    updatedBy: mongoose.Types.ObjectId;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
      default: '',
    },
    prices: [
      {
        currency: {
          type: String,
          enum: ['₹', '$'],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    defaultStones: [
      {
        stoneId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Stone',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0.1,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updateHistory: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Use a more robust model export for production stability
let Design: mongoose.Model<IDesign>;

try {
  Design = mongoose.model<IDesign>('Design');
} catch {
  Design = mongoose.model<IDesign>('Design', designSchema);
}

export default Design;

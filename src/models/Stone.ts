import mongoose, { Document } from 'mongoose';

interface IStone extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  number: string;
  quantity: number;
  unit: string;
  inventoryType: 'internal' | 'out';
  supplier?: string;
  cost?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stoneSchema = new mongoose.Schema(
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
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      enum: ['g', 'kg'],
      required: true,
    },
    weightPerPiece: {
      type: Number,
      required: false,
      min: 0,
      default: 0, // Weight in grams per piece
    },
    inventoryType: {
      type: String,
      enum: ['internal', 'out'],
      default: 'internal',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique number per inventory type
stoneSchema.index({ number: 1, inventoryType: 1 }, { unique: true });

// Use a more robust model export for production stability
let Stone: mongoose.Model<IStone>;

try {
  Stone = mongoose.model<IStone>('Stone');
} catch {
  Stone = mongoose.model<IStone>('Stone', stoneSchema);
}

export default Stone;

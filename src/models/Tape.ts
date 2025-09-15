import mongoose, { Document } from 'mongoose';

interface ITape extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  supplier?: string;
  cost?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tapeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Cello Tape',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique name
tapeSchema.index({ name: 1 }, { unique: true });

// Use a more robust model export for production stability
let Tape: mongoose.Model<ITape>;

try {
  Tape = mongoose.model<ITape>('Tape');
} catch {
  Tape = mongoose.model<ITape>('Tape', tapeSchema);
}

export default Tape;

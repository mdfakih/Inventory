import mongoose, { Document } from 'mongoose';

interface IPlastic extends Document {
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

const plasticSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      required: true,
      min: 1,
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
plasticSchema.index({ name: 1 }, { unique: true });

// Use a more robust model export for production stability
let Plastic: mongoose.Model<IPlastic>;

try {
  Plastic = mongoose.model<IPlastic>('Plastic');
} catch {
  Plastic = mongoose.model<IPlastic>('Plastic', plasticSchema);
}

export default Plastic;

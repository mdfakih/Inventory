import mongoose, { Document } from 'mongoose';

interface IPlastic extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  width: number;
  quantity: number;
  unit: string;
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

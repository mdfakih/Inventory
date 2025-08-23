import mongoose from 'mongoose';

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
      required: true,
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

export default mongoose.models.Stone || mongoose.model('Stone', stoneSchema);

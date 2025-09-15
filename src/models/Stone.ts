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
let Stone: mongoose.Model<any>;

try {
  Stone = mongoose.model('Stone');
} catch (error) {
  Stone = mongoose.model('Stone', stoneSchema);
}

export default Stone;

import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema(
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
    totalPieces: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    piecesPerRoll: {
      type: Number,
      required: true,
      min: 1,
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

// Ensure unique name per inventory type
paperSchema.index({ name: 1, inventoryType: 1 }, { unique: true });

// Use a more robust model export for production stability
let Paper: mongoose.Model<any>;

try {
  Paper = mongoose.model('Paper');
} catch (error) {
  Paper = mongoose.model('Paper', paperSchema);
}

export default Paper;

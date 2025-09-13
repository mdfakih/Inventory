import mongoose from 'mongoose';

const inventoryEntrySchema = new mongoose.Schema(
  {
    entryType: {
      type: String,
      enum: ['purchase', 'return', 'adjustment'],
      required: true,
    },
    inventoryType: {
      type: String,
      enum: ['paper', 'plastic', 'stones', 'tape', 'mixed'],
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    billNumber: {
      type: String,
      trim: true,
    },
    billDate: {
      type: Date,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          default: 'pcs',
        },
        // For paper items
        piecesPerRoll: {
          type: Number,
        },
        weightPerPiece: {
          type: Number,
        },
        // For stones/tape items
        width: {
          type: Number,
        },
      },
    ],
    totalAmount: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['order', 'other'],
    },
    sourceOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    sourceDescription: {
      type: String,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
inventoryEntrySchema.index({ inventoryType: 1, createdAt: -1 });
inventoryEntrySchema.index({ supplier: 1, createdAt: -1 });
inventoryEntrySchema.index({ enteredBy: 1, createdAt: -1 });

export default mongoose.models.InventoryEntry ||
  mongoose.model('InventoryEntry', inventoryEntrySchema);

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['internal', 'out'],
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: true,
    },

    paperUsed: {
      sizeInInch: {
        type: Number,
        required: true,
      },
      quantityInPcs: {
        type: Number,
        required: true,
        min: 0,
      },
      paperWeightPerPc: {
        type: Number,
        required: true,
        min: 0,
      },
      customPaperWeight: {
        type: Number,
        min: 0,
      },
    },

    finalTotalWeight: {
      type: Number,
      min: 0,
    },
    calculatedWeight: {
      type: Number,
      min: 0,
    },
    weightDiscrepancy: {
      type: Number,
      default: 0,
    },
    discrepancyPercentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Track if out order has been finalized (materials consumed)
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: {
      type: Date,
    },
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

export default mongoose.models.Order || mongoose.model('Order', orderSchema);

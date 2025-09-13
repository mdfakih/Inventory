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
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    gstNumber: {
      type: String,
      trim: true,
    },

    // Updated to support multiple design orders
    designOrders: [
      {
        designId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Design',
          required: true,
        },

        stonesUsed: [
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
        // Other inventory items used
        otherItemsUsed: [
          {
            itemType: {
              type: String,
              enum: ['plastic', 'tape', 'other'],
              required: true,
            },
            itemId: {
              type: mongoose.Schema.Types.ObjectId,
              refPath: 'otherItemsUsed.itemType',
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
              min: 0.1,
            },
            unit: {
              type: String,
              default: 'pcs',
            },
          },
        ],
        calculatedWeight: {
          type: Number,
          min: 0,
        },
        finalWeight: {
          type: Number,
          min: 0,
        },
        unitPrice: {
          type: Number,
          min: 0,
        },
        totalPrice: {
          type: Number,
          min: 0,
        },
      },
    ],

    // Legacy fields for backward compatibility (will be calculated from designOrders)
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
    },
    stonesUsed: [
      {
        stoneId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Stone',
        },
        quantity: {
          type: Number,
          min: 0,
        },
      },
    ],
    paperUsed: {
      sizeInInch: {
        type: Number,
      },
      quantityInPcs: {
        type: Number,
        min: 0,
      },
      paperWeightPerPc: {
        type: Number,
        min: 0,
      },
      customPaperWeight: {
        type: Number,
        min: 0,
      },
    },
    // Legacy fields for other inventory items
    otherItemsUsed: [
      {
        itemType: {
          type: String,
          enum: ['plastic', 'tape', 'other'],
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'otherItemsUsed.itemType',
        },
        quantity: {
          type: Number,
          min: 0,
        },
        unit: {
          type: String,
          default: 'pcs',
        },
      },
    ],

    // Payment and pricing fields
    modeOfPayment: {
      type: String,
      enum: ['cash', 'UPI', 'card'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'overdue'],
      default: 'pending',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    finalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
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

// Pre-save middleware to calculate totals and maintain backward compatibility
orderSchema.pre('save', function (next) {
  if (this.designOrders && this.designOrders.length > 0) {
    // Calculate total cost from all design orders
    this.totalCost = this.designOrders.reduce((sum, designOrder) => {
      return sum + (designOrder.totalPrice || 0);
    }, 0);

    // Calculate total calculated weight from all design orders
    this.calculatedWeight = this.designOrders.reduce((sum, designOrder) => {
      return sum + (designOrder.calculatedWeight || 0);
    }, 0);

    // Calculate total final weight from all design orders
    if (this.designOrders.some((designOrder) => designOrder.finalWeight)) {
      this.finalTotalWeight = this.designOrders.reduce((sum, designOrder) => {
        return sum + (designOrder.finalWeight || 0);
      }, 0);
    }

    // Maintain backward compatibility for single design
    if (this.designOrders.length === 1) {
      const singleDesign = this.designOrders[0];
      this.designId = singleDesign.designId;
      this.stonesUsed = singleDesign.stonesUsed;
      this.paperUsed = singleDesign.paperUsed;
    }

    // Calculate weight discrepancy if final weight is set
    if (this.finalTotalWeight && this.calculatedWeight) {
      this.weightDiscrepancy = this.finalTotalWeight - this.calculatedWeight;
      this.discrepancyPercentage =
        (this.weightDiscrepancy / this.calculatedWeight) * 100;
    }
  }

  // Calculate final amount after discount
  if (this.totalCost > 0) {
    if (this.discountType === 'percentage') {
      this.discountedAmount = (this.totalCost * this.discountValue) / 100;
    } else {
      this.discountedAmount = this.discountValue;
    }
    this.finalAmount = this.totalCost - this.discountedAmount;
  }

  next();
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);

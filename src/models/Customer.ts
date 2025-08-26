import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    company: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['retail', 'wholesale', 'corporate'],
      default: 'retail',
    },
    creditLimit: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', '7days', '15days', '30days', '45days'],
      default: 'immediate',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: [String],
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

// Create compound index for name and phone combination
customerSchema.index({ name: 1, phone: 1 });

// Create text index for search functionality
customerSchema.index({
  name: 'text',
  phone: 'text',
  email: 'text',
  company: 'text',
});

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);

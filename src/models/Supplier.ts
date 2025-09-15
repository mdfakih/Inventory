import mongoose, { Document } from 'mongoose';

interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique supplier name
supplierSchema.index({ name: 1 }, { unique: true });

// Use a more robust model export for production stability
let Supplier: mongoose.Model<ISupplier>;

try {
  Supplier = mongoose.model<ISupplier>('Supplier');
} catch {
  Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
}

export default Supplier;

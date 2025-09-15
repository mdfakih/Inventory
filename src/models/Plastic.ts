import mongoose from 'mongoose';

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
let Plastic: mongoose.Model<any>;

try {
  Plastic = mongoose.model('Plastic');
} catch (error) {
  Plastic = mongoose.model('Plastic', plasticSchema);
}

export default Plastic;

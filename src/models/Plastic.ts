import mongoose from 'mongoose';

const plasticSchema = new mongoose.Schema({
  width: {
    type: Number,
    enum: [12, 14, 16, 18, 20],
    required: true,
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
}, {
  timestamps: true,
});

// Ensure unique width
plasticSchema.index({ width: 1 }, { unique: true });

export default mongoose.models.Plastic || mongoose.model('Plastic', plasticSchema);

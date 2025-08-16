import mongoose from 'mongoose';

const plasticSchema = new mongoose.Schema({
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
}, {
  timestamps: true,
});

// Ensure unique name
plasticSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Plastic || mongoose.model('Plastic', plasticSchema);

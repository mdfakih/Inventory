import mongoose from 'mongoose';

const tapeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Cello Tape',
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
tapeSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Tape || mongoose.model('Tape', tapeSchema);

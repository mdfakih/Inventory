import mongoose from 'mongoose';

const tapeSchema = new mongoose.Schema({
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

export default mongoose.models.Tape || mongoose.model('Tape', tapeSchema);

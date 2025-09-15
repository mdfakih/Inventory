import mongoose from 'mongoose';

const tapeSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

// Ensure unique name
tapeSchema.index({ name: 1 }, { unique: true });

// Use a more robust model export for production stability
let Tape: mongoose.Model<any>;

try {
  Tape = mongoose.model('Tape');
} catch (error) {
  Tape = mongoose.model('Tape', tapeSchema);
}

export default Tape;

import mongoose from 'mongoose';

const designSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  paperConfigurations: [{
    paperSize: {
      type: Number,
      enum: [9, 13, 16, 19, 20, 24],
      required: true,
    },
    defaultStones: [{
      stoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stone',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
  }],
  defaultStones: [{
    stoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stone',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updateHistory: [{
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
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Design || mongoose.model('Design', designSchema);

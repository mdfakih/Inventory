const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Design Schema with old structure (for reading existing data)
const oldDesignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: false, min: 0, default: null },
  currency: { type: String, enum: ['₹', '$'], required: false, default: null },
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

// Design Schema with new structure
const newDesignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  prices: [{
    currency: {
      type: String,
      enum: ['₹', '$'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
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

const OldDesign = mongoose.model('Design', oldDesignSchema);
const NewDesign = mongoose.model('Design_new', newDesignSchema);

async function migratePrices() {
  try {
    console.log('Starting price migration...');
    
    // Get all existing designs
    const existingDesigns = await OldDesign.find({});
    console.log(`Found ${existingDesigns.length} designs to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const design of existingDesigns) {
      try {
        // Convert old price/currency to new prices array
        const prices = [];
        if (design.price && design.currency) {
          prices.push({
            currency: design.currency,
            price: design.price
          });
        }
        
        // Create new design document with updated structure
        const newDesign = new NewDesign({
          name: design.name,
          number: design.number,
          imageUrl: design.imageUrl,
          prices: prices,
          paperConfigurations: design.paperConfigurations,
          defaultStones: design.defaultStones,
          createdBy: design.createdBy,
          updatedBy: design.updatedBy,
          updateHistory: design.updateHistory,
          createdAt: design.createdAt,
          updatedAt: design.updatedAt
        });
        
        await newDesign.save();
        migratedCount++;
        console.log(`Migrated design: ${design.name} (${design.number})`);
        
      } catch (error) {
        console.error(`Error migrating design ${design.name}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`\nMigration completed!`);
    console.log(`Successfully migrated: ${migratedCount} designs`);
    console.log(`Skipped: ${skippedCount} designs`);
    
    // Instructions for manual collection replacement
    console.log(`\nNext steps:`);
    console.log(`1. Backup your current 'designs' collection`);
    console.log(`2. Drop the current 'designs' collection`);
    console.log(`3. Rename 'designs_new' to 'designs'`);
    console.log(`4. Update your application code to use the new price structure`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration
migratePrices();

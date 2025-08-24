const mongoose = require('mongoose');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI =
  'mongodb+srv://mf9049:ujJSL9ykfQxEjxNn@cluster0.eaozuqh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Paper Schema (matching the updated model)
const paperSchema = new mongoose.Schema(
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
    totalPieces: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    piecesPerRoll: {
      type: Number,
      required: true,
      min: 1,
    },
    weightPerPiece: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    inventoryType: {
      type: String,
      enum: ['internal', 'out'],
      default: 'internal',
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

const Paper = mongoose.model('Paper', paperSchema);

async function migrateTotalPieces() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find all paper records that don't have totalPieces field or have totalPieces as 0
    const papers = await Paper.find({
      $or: [{ totalPieces: { $exists: false } }, { totalPieces: 0 }],
    });

    console.log(`Found ${papers.length} paper records to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const paper of papers) {
      try {
        // Calculate totalPieces from quantity * piecesPerRoll
        const totalPieces = paper.quantity * paper.piecesPerRoll;

        // Update the paper record
        await Paper.findByIdAndUpdate(paper._id, {
          totalPieces: totalPieces,
        });

        console.log(
          `Updated paper ${paper.name} (${paper.width}") - Quantity: ${paper.quantity}, Pieces per roll: ${paper.piecesPerRoll}, Total pieces: ${totalPieces}`,
        );
        updatedCount++;
      } catch (error) {
        console.error(`Error updating paper ${paper.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration completed!');
    console.log(`Successfully updated: ${updatedCount} records`);
    console.log(`Errors: ${errorCount} records`);

    // Verify the migration
    const papersWithoutTotalPieces = await Paper.find({
      $or: [{ totalPieces: { $exists: false } }, { totalPieces: 0 }],
    });

    if (papersWithoutTotalPieces.length === 0) {
      console.log('✅ All paper records now have totalPieces field');
    } else {
      console.log(
        `⚠️  ${papersWithoutTotalPieces.length} records still missing totalPieces`,
      );
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateTotalPieces();

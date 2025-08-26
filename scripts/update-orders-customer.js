require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI:', MONGODB_URI);

// Order Schema (updated)
const orderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['internal', 'out'],
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: true,
    },
    stonesUsed: [
      {
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
      },
    ],
    paperUsed: {
      sizeInInch: {
        type: Number,
        required: true,
      },
      quantityInPcs: {
        type: Number,
        required: true,
        min: 0,
      },
      paperWeightPerPc: {
        type: Number,
        required: true,
        min: 0,
      },
      customPaperWeight: {
        type: Number,
        min: 0,
      },
    },
    // Payment and pricing fields
    modeOfPayment: {
      type: String,
      enum: ['cash', 'UPI', 'card'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'overdue'],
      default: 'pending',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    finalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    finalTotalWeight: {
      type: Number,
      min: 0,
    },
    calculatedWeight: {
      type: Number,
      min: 0,
    },
    weightDiscrepancy: {
      type: Number,
      default: 0,
    },
    discrepancyPercentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

const Order = mongoose.model('Order', orderSchema);

async function updateOrders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Check if orders collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const ordersCollectionExists = collections.some(col => col.name === 'orders');
    
    if (!ordersCollectionExists) {
      console.log('Orders collection does not exist. Nothing to update.');
      return;
    }

    console.log('Updating existing orders...');
    
    // Update all existing orders to add missing fields if they don't exist
    const updateResult = await Order.updateMany(
      { customerId: { $exists: false } },
      { 
        $set: { 
          customerId: null,
          notes: '',
          modeOfPayment: 'cash',
          paymentStatus: 'pending',
          discountType: 'percentage',
          discountValue: 0,
          totalCost: 0,
          discountedAmount: 0,
          finalAmount: 0,
          isFinalized: false
        }
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} orders successfully!`);
    
    // Also update orders that might be missing other fields
    const updateResult2 = await Order.updateMany(
      { notes: { $exists: false } },
      { $set: { notes: '' } }
    );

    console.log(`Updated ${updateResult2.modifiedCount} orders for notes field!`);

    console.log('Order collection update completed successfully!');

  } catch (error) {
    console.error('Error updating orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateOrders();

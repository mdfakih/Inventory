require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI:', MONGODB_URI);

// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    company: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['retail', 'wholesale', 'corporate'],
      default: 'retail',
    },
    creditLimit: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', '7days', '15days', '30days', '45days'],
      default: 'immediate',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: [String],
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

// Create indexes
customerSchema.index({ name: 1, phone: 1 });
customerSchema.index({
  name: 'text',
  phone: 'text',
  email: 'text',
  company: 'text',
});

const Customer = mongoose.model('Customer', customerSchema);

async function setupCustomers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Check if Customer collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const customerCollectionExists = collections.some(col => col.name === 'customers');
    
    if (customerCollectionExists) {
      console.log('Customer collection already exists. Dropping it to recreate...');
      await mongoose.connection.db.dropCollection('customers');
    }

    // Create Customer collection
    console.log('Creating Customer collection...');
    await Customer.createCollection();
    
    // Create indexes
    console.log('Creating indexes...');
    await Customer.collection.createIndex({ name: 1, phone: 1 });
    await Customer.collection.createIndex({
      name: 'text',
      phone: 'text',
      email: 'text',
      company: 'text',
    });

    console.log('Customer collection setup completed successfully!');
    
    // Create a sample customer for testing
    console.log('Creating sample customer...');
    const sampleCustomer = new Customer({
      name: 'Sample Customer',
      phone: '+91-9876543210',
      email: 'sample@example.com',
      company: 'Sample Company',
      customerType: 'retail',
      creditLimit: 10000,
      paymentTerms: 'immediate',
      isActive: true,
      notes: 'This is a sample customer for testing purposes',
      tags: ['sample', 'test'],
      createdBy: new mongoose.Types.ObjectId(), // Placeholder ID
    });
    
    await sampleCustomer.save();
    console.log('Sample customer created successfully!');

  } catch (error) {
    console.error('Error setting up Customer collection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupCustomers();

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI:', MONGODB_URI);

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
    },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

// Stone Schema
const stoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true, unique: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, enum: ['g', 'kg'], required: true },
  },
  { timestamps: true },
);

const Stone = mongoose.model('Stone', stoneSchema);

// Paper Schema
const paperSchema = new mongoose.Schema(
  {
    width: { type: Number, enum: [9, 13, 16, 19, 20, 24], required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'pcs' },
    piecesPerRoll: { type: Number, required: true, min: 1 },
    weightPerPiece: { type: Number, required: true, min: 0, default: 0 },
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
  { timestamps: true },
);

paperSchema.index({ width: 1 }, { unique: true });
const Paper = mongoose.model('Paper', paperSchema);

// Plastic Schema
const plasticSchema = new mongoose.Schema(
  {
    width: { type: Number, enum: [12, 14, 16, 18, 20], required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'pcs' },
  },
  { timestamps: true },
);

plasticSchema.index({ width: 1 }, { unique: true });
const Plastic = mongoose.model('Plastic', plasticSchema);

// Tape Schema
const tapeSchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'pcs' },
  },
  { timestamps: true },
);

const Tape = mongoose.model('Tape', tapeSchema);

// Design Schema
const designSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    paperConfigurations: [
      {
        paperSize: {
          type: Number,
          enum: [9, 13, 16, 19, 20, 24],
          required: true,
        },
        defaultStones: [
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
      },
    ],
    defaultStones: [
      {
        stoneId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Stone',
          required: true,
        },
        quantity: { type: Number, required: true, min: 0 },
      },
    ],
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
  { timestamps: true },
);

const Design = mongoose.model('Design', designSchema);

// Order Schema
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
    stoneUsed: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
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

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Stone.deleteMany({});
    await Paper.deleteMany({});
    await Plastic.deleteMany({});
    await Tape.deleteMany({});
    await Design.deleteMany({});
    await Order.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      name: 'Admin User',
    });
    await adminUser.save();

    // Create manager user
    console.log('Creating manager user...');
    const managerUser = new User({
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'manager',
      name: 'Manager User',
    });
    await managerUser.save();

    // Create employee user
    console.log('Creating employee user...');
    const employeeUser = new User({
      email: 'employee@example.com',
      password: hashedPassword,
      role: 'employee',
      name: 'Employee User',
    });
    await employeeUser.save();

    // Create sample stones
    console.log('Creating sample stones...');
    const stones = [
      {
        name: 'Red Stone',
        number: 'RS001',
        color: 'Red',
        size: 'Small',
        quantity: 500,
        unit: 'g',
      },
      {
        name: 'Blue Stone',
        number: 'BS001',
        color: 'Blue',
        size: 'Medium',
        quantity: 300,
        unit: 'g',
      },
      {
        name: 'Green Stone',
        number: 'GS001',
        color: 'Green',
        size: 'Large',
        quantity: 200,
        unit: 'kg',
      },
      {
        name: 'Yellow Stone',
        number: 'YS001',
        color: 'Yellow',
        size: 'Small',
        quantity: 400,
        unit: 'g',
      },
      {
        name: 'Purple Stone',
        number: 'PS001',
        color: 'Purple',
        size: 'Medium',
        quantity: 250,
        unit: 'g',
      },
    ];

    const createdStones = [];
    for (const stoneData of stones) {
      const stone = new Stone(stoneData);
      await stone.save();
      createdStones.push(stone);
    }

    // Create sample paper
    console.log('Creating sample paper...');
    const papers = [
      { width: 9, quantity: 10, piecesPerRoll: 1000, weightPerPiece: 20 },
      { width: 13, quantity: 8, piecesPerRoll: 750, weightPerPiece: 28 },
      { width: 16, quantity: 6, piecesPerRoll: 600, weightPerPiece: 35 },
      { width: 19, quantity: 5, piecesPerRoll: 500, weightPerPiece: 42 },
      { width: 20, quantity: 4, piecesPerRoll: 487, weightPerPiece: 45 },
      { width: 24, quantity: 3, piecesPerRoll: 400, weightPerPiece: 55 },
    ];

    for (const paperData of papers) {
      const paper = new Paper(paperData);
      await paper.save();
    }

    // Create sample plastic
    console.log('Creating sample plastic...');
    const plastics = [
      { width: 12, quantity: 15 },
      { width: 14, quantity: 12 },
      { width: 16, quantity: 10 },
      { width: 18, quantity: 8 },
      { width: 20, quantity: 6 },
    ];

    for (const plasticData of plastics) {
      const plastic = new Plastic(plasticData);
      await plastic.save();
    }

    // Create sample tape
    console.log('Creating sample tape...');
    const tape = new Tape({ quantity: 50 });
    await tape.save();

    // Create sample designs with paper configurations
    console.log('Creating sample designs...');
    const designs = [
      {
        name: 'Classic Design',
        number: 'DES001',
        imageUrl: 'https://via.placeholder.com/300x200?text=Classic+Design',
        paperConfigurations: [
          {
            paperSize: 9,
            defaultStones: [
              { stoneId: createdStones[0]._id, quantity: 50 },
              { stoneId: createdStones[1]._id, quantity: 30 },
            ],
          },
          {
            paperSize: 13,
            defaultStones: [
              { stoneId: createdStones[0]._id, quantity: 70 },
              { stoneId: createdStones[1]._id, quantity: 45 },
            ],
          },
        ],
        defaultStones: [
          { stoneId: createdStones[0]._id, quantity: 50 },
          { stoneId: createdStones[1]._id, quantity: 30 },
        ],
        createdBy: adminUser._id,
      },
      {
        name: 'Modern Design',
        number: 'DES002',
        imageUrl: 'https://via.placeholder.com/300x200?text=Modern+Design',
        paperConfigurations: [
          {
            paperSize: 16,
            defaultStones: [
              { stoneId: createdStones[2]._id, quantity: 100 },
              { stoneId: createdStones[3]._id, quantity: 40 },
            ],
          },
          {
            paperSize: 20,
            defaultStones: [
              { stoneId: createdStones[2]._id, quantity: 120 },
              { stoneId: createdStones[3]._id, quantity: 50 },
            ],
          },
        ],
        defaultStones: [
          { stoneId: createdStones[2]._id, quantity: 100 },
          { stoneId: createdStones[3]._id, quantity: 40 },
        ],
        createdBy: adminUser._id,
      },
      {
        name: 'Elegant Design',
        number: 'DES003',
        imageUrl: 'https://via.placeholder.com/300x200?text=Elegant+Design',
        paperConfigurations: [
          {
            paperSize: 19,
            defaultStones: [
              { stoneId: createdStones[4]._id, quantity: 35 },
              { stoneId: createdStones[0]._id, quantity: 25 },
            ],
          },
          {
            paperSize: 24,
            defaultStones: [
              { stoneId: createdStones[4]._id, quantity: 45 },
              { stoneId: createdStones[0]._id, quantity: 35 },
            ],
          },
        ],
        defaultStones: [
          { stoneId: createdStones[4]._id, quantity: 35 },
          { stoneId: createdStones[0]._id, quantity: 25 },
        ],
        createdBy: adminUser._id,
      },
    ];

    for (const designData of designs) {
      const design = new Design(designData);
      await design.save();
    }

    console.log('Database setup completed successfully!');
    console.log('\nSample users created:');
    console.log('- Admin: admin@example.com / admin123');
    console.log('- Manager: manager@example.com / admin123');
    console.log('- Employee: employee@example.com / admin123');
    console.log('\nSample data created:');
    console.log('- 5 stones');
    console.log('- 6 paper types (with weights)');
    console.log('- 5 plastic types');
    console.log('- 1 tape entry');
    console.log('- 3 designs (with paper configurations)');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
setupDatabase();

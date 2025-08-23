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
    number: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, enum: ['g', 'kg'], required: true },
    inventoryType: {
      type: String,
      enum: ['internal', 'out'],
      default: 'internal',
      required: true,
    },
  },
  { timestamps: true },
);

// Ensure unique number per inventory type
stoneSchema.index({ number: 1, inventoryType: 1 }, { unique: true });
const Stone = mongoose.model('Stone', stoneSchema);

// Paper Schema
const paperSchema = new mongoose.Schema(
  {
    width: { type: Number, enum: [9, 13, 16, 19, 20, 24], required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'pcs' },
    piecesPerRoll: { type: Number, required: true, min: 1 },
    weightPerPiece: { type: Number, required: true, min: 0, default: 0 },
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
  { timestamps: true },
);

// Ensure unique width per inventory type
paperSchema.index({ width: 1, inventoryType: 1 }, { unique: true });
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
    // For out orders: track received materials
    receivedMaterials: {
      stones: [
        {
          stoneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stone',
          },
          quantity: {
            type: Number,
            min: 0,
          },
        },
      ],
      paper: {
        sizeInInch: {
          type: Number,
        },
        quantityInPcs: {
          type: Number,
          min: 0,
        },
        paperWeightPerPc: {
          type: Number,
          min: 0,
        },
      },
    },
    finalTotalWeight: {
      type: Number,
      min: 0,
    },
    stoneUsed: {
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
    // For out orders: track stone balance and loss
    stoneBalance: {
      type: Number,
      default: 0,
    },
    stoneLoss: {
      type: Number,
      default: 0,
    },
    paperBalance: {
      type: Number,
      default: 0,
    },
    paperLoss: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Track if out order has been finalized (materials consumed)
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

    // Create sample internal stones
    console.log('Creating sample internal stones...');
    const internalStones = [
      {
        name: 'Ruby Stone',
        number: 'RS001',
        color: 'Red',
        size: 'Small',
        quantity: 500,
        unit: 'g',
        inventoryType: 'internal',
      },
      {
        name: 'Sapphire Stone',
        number: 'SS001',
        color: 'Blue',
        size: 'Medium',
        quantity: 300,
        unit: 'g',
        inventoryType: 'internal',
      },
      {
        name: 'Emerald Stone',
        number: 'ES001',
        color: 'Green',
        size: 'Large',
        quantity: 200,
        unit: 'kg',
        inventoryType: 'internal',
      },
      {
        name: 'Topaz Stone',
        number: 'TS001',
        color: 'Yellow',
        size: 'Small',
        quantity: 400,
        unit: 'g',
        inventoryType: 'internal',
      },
      {
        name: 'Amethyst Stone',
        number: 'AS001',
        color: 'Purple',
        size: 'Medium',
        quantity: 250,
        unit: 'g',
        inventoryType: 'internal',
      },
      {
        name: 'Diamond Stone',
        number: 'DS001',
        color: 'White',
        size: 'Large',
        quantity: 150,
        unit: 'g',
        inventoryType: 'internal',
      },
      {
        name: 'Garnet Stone',
        number: 'GS001',
        color: 'Dark Red',
        size: 'Medium',
        quantity: 350,
        unit: 'g',
        inventoryType: 'internal',
      },
    ];

    const createdInternalStones = [];
    for (const stoneData of internalStones) {
      const stone = new Stone(stoneData);
      await stone.save();
      createdInternalStones.push(stone);
    }

    // Create sample out job stones
    console.log('Creating sample out job stones...');
    const outStones = [
      {
        name: 'Customer Ruby Stone',
        number: 'CRS001',
        color: 'Red',
        size: 'Small',
        quantity: 100,
        unit: 'g',
        inventoryType: 'out',
      },
      {
        name: 'Customer Sapphire Stone',
        number: 'CSS001',
        color: 'Blue',
        size: 'Medium',
        quantity: 150,
        unit: 'g',
        inventoryType: 'out',
      },
      {
        name: 'Customer Emerald Stone',
        number: 'CES001',
        color: 'Green',
        size: 'Large',
        quantity: 75,
        unit: 'kg',
        inventoryType: 'out',
      },
      {
        name: 'Customer Topaz Stone',
        number: 'CTS001',
        color: 'Yellow',
        size: 'Small',
        quantity: 80,
        unit: 'g',
        inventoryType: 'out',
      },
    ];

    const createdOutStones = [];
    for (const stoneData of outStones) {
      const stone = new Stone(stoneData);
      await stone.save();
      createdOutStones.push(stone);
    }

    // Create sample internal paper
    console.log('Creating sample internal paper...');
    const internalPapers = [
      { width: 9, quantity: 10, piecesPerRoll: 1000, weightPerPiece: 20, inventoryType: 'internal' },
      { width: 13, quantity: 8, piecesPerRoll: 750, weightPerPiece: 28, inventoryType: 'internal' },
      { width: 16, quantity: 6, piecesPerRoll: 600, weightPerPiece: 35, inventoryType: 'internal' },
      { width: 19, quantity: 5, piecesPerRoll: 500, weightPerPiece: 42, inventoryType: 'internal' },
      { width: 20, quantity: 4, piecesPerRoll: 487, weightPerPiece: 45, inventoryType: 'internal' },
      { width: 24, quantity: 3, piecesPerRoll: 400, weightPerPiece: 55, inventoryType: 'internal' },
    ];

    for (const paperData of internalPapers) {
      const paper = new Paper(paperData);
      await paper.save();
    }

    // Create sample out job paper
    console.log('Creating sample out job paper...');
    const outPapers = [
      { width: 9, quantity: 5, piecesPerRoll: 1000, weightPerPiece: 20, inventoryType: 'out' },
      { width: 13, quantity: 3, piecesPerRoll: 750, weightPerPiece: 28, inventoryType: 'out' },
    ];

    for (const paperData of outPapers) {
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
              { stoneId: createdInternalStones[0]._id, quantity: 50 },
              { stoneId: createdInternalStones[1]._id, quantity: 30 },
            ],
          },
          {
            paperSize: 13,
            defaultStones: [
              { stoneId: createdInternalStones[0]._id, quantity: 70 },
              { stoneId: createdInternalStones[1]._id, quantity: 45 },
            ],
          },
        ],
        defaultStones: [
          { stoneId: createdInternalStones[0]._id, quantity: 50 },
          { stoneId: createdInternalStones[1]._id, quantity: 30 },
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
              { stoneId: createdInternalStones[2]._id, quantity: 100 },
              { stoneId: createdInternalStones[3]._id, quantity: 40 },
            ],
          },
          {
            paperSize: 20,
            defaultStones: [
              { stoneId: createdInternalStones[2]._id, quantity: 120 },
              { stoneId: createdInternalStones[3]._id, quantity: 50 },
            ],
          },
        ],
        defaultStones: [
          { stoneId: createdInternalStones[2]._id, quantity: 100 },
          { stoneId: createdInternalStones[3]._id, quantity: 40 },
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
              { stoneId: createdInternalStones[4]._id, quantity: 35 },
              { stoneId: createdInternalStones[0]._id, quantity: 25 },
            ],
          },
          {
            paperSize: 24,
            defaultStones: [
              { stoneId: createdInternalStones[4]._id, quantity: 45 },
              { stoneId: createdInternalStones[0]._id, quantity: 35 },
            ],
          },
        ],
        defaultStones: [
          { stoneId: createdInternalStones[4]._id, quantity: 35 },
          { stoneId: createdInternalStones[0]._id, quantity: 25 },
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
    console.log('- 7 internal stones');
    console.log('- 4 out job stones');
    console.log('- 6 internal paper types (with weights)');
    console.log('- 2 out job paper types');
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

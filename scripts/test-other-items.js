const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI:', MONGODB_URI);

// Define schemas inline (similar to setup.js)
const plasticSchema = new mongoose.Schema(
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
    unit: {
      type: String,
      default: 'pcs',
    },
  },
  {
    timestamps: true,
  },
);

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
  },
  {
    timestamps: true,
  },
);

const stoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'g',
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
  },
  {
    timestamps: true,
  },
);

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
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
    prices: [
      {
        currency: {
          type: String,
          enum: ['₹', '$'],
          default: '₹',
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
    },
  },
  {
    timestamps: true,
  },
);

// Create models
const Plastic = mongoose.model('Plastic', plasticSchema);
const Tape = mongoose.model('Tape', tapeSchema);
const Paper = mongoose.model('Paper', paperSchema);
const Stone = mongoose.model('Stone', stoneSchema);
const Design = mongoose.model('Design', designSchema);
const User = mongoose.model('User', userSchema);

async function testOtherItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test data
    console.log('Creating test data...');

    // Create a test user
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log('No admin user found, creating one...');
      const testUser = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      });
      await testUser.save();
    }

    // Create test plastic (check if exists first)
    let plastic = await Plastic.findOne({ name: 'Test Plastic' });
    if (!plastic) {
      plastic = new Plastic({
        name: 'Test Plastic',
        width: 12,
        quantity: 100,
        unit: 'pcs',
      });
      await plastic.save();
      console.log('Created test plastic:', plastic._id);
    } else {
      console.log('Test plastic already exists:', plastic._id);
    }

    // Create test tape (check if exists first)
    let tape = await Tape.findOne({ name: 'Test Tape' });
    if (!tape) {
      tape = new Tape({
        name: 'Test Tape',
        quantity: 50,
        unit: 'pcs',
      });
      await tape.save();
      console.log('Created test tape:', tape._id);
    } else {
      console.log('Test tape already exists:', tape._id);
    }

    // Create test paper (check if exists first)
    let paper = await Paper.findOne({ name: 'Test Paper' });
    if (!paper) {
      paper = new Paper({
        name: 'Test Paper',
        width: 8.5,
        quantity: 10,
        totalPieces: 5000,
        piecesPerRoll: 500,
        weightPerPiece: 5,
        inventoryType: 'internal',
      });
      await paper.save();
      console.log('Created test paper:', paper._id);
    } else {
      console.log('Test paper already exists:', paper._id);
    }

    // Create test stone (check if exists first)
    let stone = await Stone.findOne({ number: 'TS001' });
    if (!stone) {
      stone = new Stone({
        name: 'Test Stone',
        number: 'TS001',
        color: 'Red',
        size: '2mm',
        quantity: 1000,
        unit: 'g',
        weightPerPiece: 0.1,
        inventoryType: 'internal',
      });
      await stone.save();
      console.log('Created test stone:', stone._id);
    } else {
      console.log('Test stone already exists:', stone._id);
    }

    // Create test design (check if exists first)
    let design = await Design.findOne({ number: 'TD001' });
    if (!design) {
      design = new Design({
        name: 'Test Design',
        number: 'TD001',
        defaultStones: [
          {
            stoneId: stone._id,
            quantity: 2, // 2g per piece
          },
        ],
        prices: [
          {
            currency: '₹',
            price: 100,
          },
        ],
      });
      await design.save();
      console.log('Created test design:', design._id);
    } else {
      console.log('Test design already exists:', design._id);
    }

    console.log('\nTest data created successfully!');
    console.log(
      'You can now test the order creation with other inventory items.',
    );
    console.log('\nTest order data structure:');
    console.log(
      JSON.stringify(
        {
          type: 'internal',
          customerName: 'Test Customer',
          phone: '1234567890',
          designOrders: [
            {
              designId: design._id,
              paperUsed: {
                sizeInInch: 8.5,
                quantityInPcs: 10,
              },
              otherItemsUsed: [
                {
                  itemType: 'plastic',
                  itemId: plastic._id,
                  quantity: 5,
                  unit: 'pcs',
                },
                {
                  itemType: 'tape',
                  itemId: tape._id,
                  quantity: 2,
                  unit: 'pcs',
                },
              ],
            },
          ],
          modeOfPayment: 'cash',
          paymentStatus: 'pending',
          discountType: 'percentage',
          discountValue: 0,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testOtherItems();

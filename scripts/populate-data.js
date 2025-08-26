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

customerSchema.index({ name: 1, phone: 1 });
customerSchema.index({
  name: 'text',
  phone: 'text',
  email: 'text',
  company: 'text',
});

const Customer = mongoose.model('Customer', customerSchema);

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

paperSchema.index({ width: 1, inventoryType: 1 }, { unique: true });
const Paper = mongoose.model('Paper', paperSchema);

// Design Schema
const designSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    prices: [
      {
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

async function populateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Get existing users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found. Please run setup.js first to create users.');
      return;
    }

    const adminUser = users.find(u => u.role === 'admin') || users[0];
    const managerUser = users.find(u => u.role === 'manager') || users[0];
    const employeeUser = users.find(u => u.role === 'employee') || users[0];

    console.log(`Found ${users.length} users. Building upon existing data...`);

    // Clear existing data to avoid duplicates
    console.log('Clearing existing data to avoid duplicates...');
    await Customer.deleteMany({});
    await Design.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing customers, designs, and orders');

    // Create comprehensive customer data
    console.log('Creating customers...');
    const customers = [
      {
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@kumarjewelry.com',
        address: {
          street: '123 Jewelry Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        company: 'Kumar Jewelry',
        gstNumber: '27ABCDE1234F1Z5',
        customerType: 'wholesale',
        creditLimit: 500000,
        paymentTerms: '30days',
        isActive: true,
        notes: 'Premium wholesale customer, prefers bulk orders',
        tags: ['wholesale', 'premium', 'bulk'],
        createdBy: adminUser._id
      },
      {
        name: 'Priya Sharma',
        phone: '+91-8765432109',
        email: 'priya@elegantdesigns.com',
        address: {
          street: '456 Design Street',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        company: 'Elegant Designs',
        gstNumber: '07FGHIJ5678K9L2',
        customerType: 'corporate',
        creditLimit: 1000000,
        paymentTerms: '45days',
        isActive: true,
        notes: 'Corporate client, seasonal orders',
        tags: ['corporate', 'seasonal', 'high-value'],
        createdBy: managerUser._id
      },
      {
        name: 'Amit Patel',
        phone: '+91-7654321098',
        email: 'amit@patelgems.com',
        address: {
          street: '789 Gem Road',
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395001',
          country: 'India'
        },
        company: 'Patel Gems',
        gstNumber: '24MNOPQ9012R3S6',
        customerType: 'wholesale',
        creditLimit: 750000,
        paymentTerms: '15days',
        isActive: true,
        notes: 'Regular wholesale customer, fast payments',
        tags: ['wholesale', 'regular', 'fast-payment'],
        createdBy: employeeUser._id
      },
      {
        name: 'Sneha Reddy',
        phone: '+91-6543210987',
        email: 'sneha@reddyjewelry.com',
        address: {
          street: '321 Jewelry Circle',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          country: 'India'
        },
        company: 'Reddy Jewelry',
        gstNumber: '36TUVWX3456Y7Z8',
        customerType: 'retail',
        creditLimit: 100000,
        paymentTerms: 'immediate',
        isActive: true,
        notes: 'Retail customer, prefers custom designs',
        tags: ['retail', 'custom', 'design-focused'],
        createdBy: managerUser._id
      },
      {
        name: 'Vikram Singh',
        phone: '+91-5432109876',
        email: 'vikram@singhstones.com',
        address: {
          street: '654 Stone Avenue',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
          country: 'India'
        },
        company: 'Singh Stones',
        gstNumber: '08ABCD1234E5F6',
        customerType: 'wholesale',
        creditLimit: 300000,
        paymentTerms: '7days',
        isActive: true,
        notes: 'Stone supplier, bulk stone orders',
        tags: ['wholesale', 'stone-supplier', 'bulk'],
        createdBy: adminUser._id
      },
      {
        name: 'Meera Iyer',
        phone: '+91-4321098765',
        email: 'meera@iyerdesigns.com',
        address: {
          street: '987 Design Plaza',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        company: 'Iyer Designs',
        gstNumber: '29GHIJ5678K9L1',
        customerType: 'corporate',
        creditLimit: 800000,
        paymentTerms: '30days',
        isActive: true,
        notes: 'Design studio, artistic collaborations',
        tags: ['corporate', 'design-studio', 'artistic'],
        createdBy: managerUser._id
      },
      {
        name: 'Arjun Mehta',
        phone: '+91-3210987654',
        email: 'arjun@mehtajewelry.com',
        address: {
          street: '147 Jewelry Square',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          country: 'India'
        },
        company: 'Mehta Jewelry',
        gstNumber: '33KLMN9012O3P4',
        customerType: 'retail',
        creditLimit: 150000,
        paymentTerms: 'immediate',
        isActive: true,
        notes: 'High-end retail, luxury pieces',
        tags: ['retail', 'luxury', 'high-end'],
        createdBy: employeeUser._id
      },
      {
        name: 'Kavya Nair',
        phone: '+91-2109876543',
        email: 'kavya@nairgems.com',
        address: {
          street: '258 Gem Street',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700001',
          country: 'India'
        },
        company: 'Nair Gems',
        gstNumber: '19QRST5678U9V0',
        customerType: 'wholesale',
        creditLimit: 400000,
        paymentTerms: '15days',
        isActive: true,
        notes: 'Traditional jewelry, heritage pieces',
        tags: ['wholesale', 'traditional', 'heritage'],
        createdBy: adminUser._id
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = new Customer(customerData);
      await customer.save();
      createdCustomers.push(customer);
      console.log(`Created customer: ${customer.name}`);
    }

    // Get existing stones and paper for orders
    const stones = await Stone.find({});
    const papers = await Paper.find({});

    if (stones.length === 0 || papers.length === 0) {
      console.log('No stones or paper found. Please run setup.js first.');
      return;
    }

    // Create comprehensive design data
    console.log('Creating designs...');
    const designs = [
      {
        name: 'Royal Peacock',
        number: 'DES001',
        imageUrl: 'https://via.placeholder.com/300x200?text=Royal+Peacock',
        prices: [
          { currency: '₹', price: 25000 },
          { currency: '$', price: 350 }
        ],
        defaultStones: [
          { stoneId: stones[0]._id, quantity: 75 },
          { stoneId: stones[1]._id, quantity: 45 }
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Floral Elegance',
        number: 'DES002',
        imageUrl: 'https://via.placeholder.com/300x200?text=Floral+Elegance',
        prices: [
          { currency: '₹', price: 18000 },
          { currency: '$', price: 250 }
        ],
        defaultStones: [
          { stoneId: stones[2]._id, quantity: 60 },
          { stoneId: stones[3]._id, quantity: 35 }
        ],
        createdBy: managerUser._id
      },
      {
        name: 'Geometric Harmony',
        number: 'DES003',
        imageUrl: 'https://via.placeholder.com/300x200?text=Geometric+Harmony',
        prices: [
          { currency: '₹', price: 22000 },
          { currency: '$', price: 300 }
        ],
        defaultStones: [
          { stoneId: stones[4]._id, quantity: 55 },
          { stoneId: stones[0]._id, quantity: 40 }
        ],
        createdBy: employeeUser._id
      },
      {
        name: 'Traditional Mandala',
        number: 'DES004',
        imageUrl: 'https://via.placeholder.com/300x200?text=Traditional+Mandala',
        prices: [
          { currency: '₹', price: 30000 },
          { currency: '$', price: 400 }
        ],
        defaultStones: [
          { stoneId: stones[1]._id, quantity: 80 },
          { stoneId: stones[2]._id, quantity: 50 }
        ],
        createdBy: adminUser._id
      },
      {
        name: 'Modern Minimalist',
        number: 'DES005',
        imageUrl: 'https://via.placeholder.com/300x200?text=Modern+Minimalist',
        prices: [
          { currency: '₹', price: 15000 },
          { currency: '$', price: 200 }
        ],
        defaultStones: [
          { stoneId: stones[3]._id, quantity: 30 },
          { stoneId: stones[4]._id, quantity: 25 }
        ],
        createdBy: managerUser._id
      },
      {
        name: 'Art Deco Classic',
        number: 'DES006',
        imageUrl: 'https://via.placeholder.com/300x200?text=Art+Deco+Classic',
        prices: [
          { currency: '₹', price: 28000 },
          { currency: '$', price: 380 }
        ],
        defaultStones: [
          { stoneId: stones[0]._id, quantity: 70 },
          { stoneId: stones[1]._id, quantity: 55 }
        ],
        createdBy: adminUser._id
      }
    ];

    const createdDesigns = [];
    for (const designData of designs) {
      const design = new Design(designData);
      await design.save();
      createdDesigns.push(design);
      console.log(`Created design: ${design.name}`);
    }

    // Create comprehensive order data
    console.log('Creating orders...');
    const orders = [];

    // Internal orders
    for (let i = 0; i < 15; i++) {
      const design = createdDesigns[Math.floor(Math.random() * createdDesigns.length)];
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const paper = papers[Math.floor(Math.random() * papers.length)];
      
      const order = {
        type: 'internal',
        customerName: customer.name,
        phone: customer.phone,
        designId: design._id,
        stonesUsed: design.defaultStones.map(stone => ({
          stoneId: stone.stoneId,
          quantity: stone.quantity + Math.floor(Math.random() * 20)
        })),
        paperUsed: {
          sizeInInch: paper.width,
          quantityInPcs: Math.floor(Math.random() * 50) + 10,
          paperWeightPerPc: paper.weightPerPiece
        },
        finalTotalWeight: Math.floor(Math.random() * 500) + 100,
        stoneUsed: Math.floor(Math.random() * 200) + 50,
        calculatedWeight: Math.floor(Math.random() * 500) + 100,
        weightDiscrepancy: Math.floor(Math.random() * 50) - 25,
        discrepancyPercentage: Math.floor(Math.random() * 10) - 5,
        status: ['pending', 'completed', 'completed', 'completed'][Math.floor(Math.random() * 4)],
        createdBy: [adminUser._id, managerUser._id, employeeUser._id][Math.floor(Math.random() * 3)]
      };
      
      orders.push(order);
    }

    // Out orders
    for (let i = 0; i < 10; i++) {
      const design = createdDesigns[Math.floor(Math.random() * createdDesigns.length)];
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const paper = papers[Math.floor(Math.random() * papers.length)];
      
      const order = {
        type: 'out',
        customerName: customer.name,
        phone: customer.phone,
        designId: design._id,
        stonesUsed: design.defaultStones.map(stone => ({
          stoneId: stone.stoneId,
          quantity: stone.quantity + Math.floor(Math.random() * 20)
        })),
        paperUsed: {
          sizeInInch: paper.width,
          quantityInPcs: Math.floor(Math.random() * 50) + 10,
          paperWeightPerPc: paper.weightPerPiece
        },
        receivedMaterials: {
          stones: design.defaultStones.map(stone => ({
            stoneId: stone.stoneId,
            quantity: stone.quantity + Math.floor(Math.random() * 20)
          })),
          paper: {
            sizeInInch: paper.width,
            quantityInPcs: Math.floor(Math.random() * 50) + 10,
            paperWeightPerPc: paper.weightPerPiece
          }
        },
        finalTotalWeight: Math.floor(Math.random() * 500) + 100,
        stoneUsed: Math.floor(Math.random() * 200) + 50,
        calculatedWeight: Math.floor(Math.random() * 500) + 100,
        weightDiscrepancy: Math.floor(Math.random() * 50) - 25,
        discrepancyPercentage: Math.floor(Math.random() * 10) - 5,
        stoneBalance: Math.floor(Math.random() * 100) + 20,
        stoneLoss: Math.floor(Math.random() * 30),
        paperBalance: Math.floor(Math.random() * 50) + 10,
        paperLoss: Math.floor(Math.random() * 20),
        status: ['pending', 'completed', 'completed'][Math.floor(Math.random() * 3)],
        isFinalized: Math.random() > 0.3,
        finalizedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        createdBy: [adminUser._id, managerUser._id, employeeUser._id][Math.floor(Math.random() * 3)]
      };
      
      orders.push(order);
    }

    // Save all orders
    for (const orderData of orders) {
      const order = new Order(orderData);
      await order.save();
      console.log(`Created ${orderData.type} order for ${orderData.customerName}`);
    }

    // Update inventory quantities based on orders
    console.log('Updating inventory quantities...');
    for (const order of orders) {
      if (order.status === 'completed') {
        // Update stone quantities
        for (const stoneUsage of order.stonesUsed) {
          const stone = await Stone.findById(stoneUsage.stoneId);
          if (stone) {
            stone.quantity = Math.max(0, stone.quantity - stoneUsage.quantity);
            await stone.save();
          }
        }

        // Update paper quantities
        const paper = await Paper.findOne({ 
          width: order.paperUsed.sizeInInch,
          inventoryType: order.type === 'internal' ? 'internal' : 'out'
        });
        if (paper) {
          paper.quantity = Math.max(0, paper.quantity - order.paperUsed.quantityInPcs);
          await paper.save();
        }
      }
    }

    console.log('\n=== Data Population Completed Successfully! ===');
    console.log(`Created ${customers.length} customers`);
    console.log(`Created ${designs.length} designs`);
    console.log(`Created ${orders.length} orders (${orders.filter(o => o.type === 'internal').length} internal, ${orders.filter(o => o.type === 'out').length} out)`);
    console.log('Updated inventory quantities based on completed orders');
    console.log('\nSample data includes:');
    console.log('- 8 diverse customers (retail, wholesale, corporate)');
    console.log('- 6 unique designs with pricing in ₹ and $');
    console.log('- 25 realistic orders with various statuses');
    console.log('- Inventory updates based on order completion');

  } catch (error) {
    console.error('Error populating data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the data population
populateData();

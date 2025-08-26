import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import Design from '@/models/Design';
import { getCurrentUser } from '@/lib/auth';

// Updated interface for creating orders with multiple designs
interface CreateOrderData {
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: string;
  gstNumber?: string;
  designOrders: Array<{
    designId: string;
    quantity: number;
    paperUsed: {
      sizeInInch: number;
      quantityInPcs: number;
    };
  }>;
  modeOfPayment: 'cash' | 'UPI' | 'card';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountedAmount: number;
  finalAmount: number;
  notes?: string;
  createdBy: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const skip = (page - 1) * limit;

    // Get total count
    const total = await Order.countDocuments();

    // Get orders with pagination
    const orders = await Order.find()
      .populate('designId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database connection failed. Please check if MongoDB is running.',
          },
          { status: 500 },
        );
      }
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database configuration error. Please check environment variables.',
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let order = null;
  const inventoryPapers: Array<{ 
    paper: { 
      _id: string; 
      totalPieces: number; 
      piecesPerRoll: number; 
      weightPerPiece: number; 
    }; 
    requiredPieces: number 
  }> = [];
  let inventoryType = 'internal';

  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 },
      );
    }

    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      type,
      customerName,
      phone,
      customerId,
      gstNumber,
      designOrders,
      modeOfPayment = 'cash',
      paymentStatus = 'pending',
      discountType = 'percentage',
      discountValue = 0,
      notes,
    } = body;

    if (!type || !customerName || !phone || !designOrders || !Array.isArray(designOrders) || designOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order type, customer details, and at least one design order are required' },
        { status: 400 },
      );
    }

    inventoryType = type === 'out' ? 'out' : 'internal';

    // Validate and process each design order
    const processedDesignOrders = [];
    const inventoryErrors = [];
    const stonesToDeduct = [];

    for (const designOrder of designOrders) {
      const { designId, quantity, paperUsed } = designOrder;

      if (!designId || !quantity || !paperUsed || !paperUsed.sizeInInch || !paperUsed.quantityInPcs) {
        return NextResponse.json(
          { success: false, message: 'Each design order must have designId, quantity, and paper details' },
          { status: 400 },
        );
      }

      // Get paper data to calculate weight
      const paper = await Paper.findOne({
        width: paperUsed.sizeInInch,
        inventoryType: inventoryType,
      });
      if (!paper) {
        return NextResponse.json(
          { success: false, message: `Paper size ${paperUsed.sizeInInch}" not found in ${inventoryType} inventory` },
          { status: 400 },
        );
      }

      // Get design to calculate stone weights as per design
      const design = await Design.findById(designId).populate(
        'defaultStones.stoneId',
      );
      if (!design) {
        return NextResponse.json(
          { success: false, message: 'Design not found' },
          { status: 400 },
        );
      }

      // Validate design applicability for the order type
      if (design.defaultStones && design.defaultStones.length > 0) {
        for (const designStone of design.defaultStones) {
          const stone = designStone.stoneId;
          if (!stone) {
            return NextResponse.json(
              {
                success: false,
                message: 'Design contains invalid stone references',
              },
              { status: 400 },
            );
          }

          // Check if stone is available in the correct inventory type
          if (stone.inventoryType !== inventoryType) {
            return NextResponse.json(
              {
                success: false,
                message: `Design not applicable for ${type} orders. Stone "${stone.name}" is only available in ${stone.inventoryType} inventory.`,
              },
              { status: 400 },
            );
          }
        }
      }

      // Calculate stone weight as per design (sum of all stone weights for the design)
      let designStoneWeight = 0;
      if (design.defaultStones && design.defaultStones.length > 0) {
        for (const designStone of design.defaultStones) {
          const stone = designStone.stoneId;
          if (stone) {
            // Use weightPerPiece if available, otherwise use quantity as fallback
            designStoneWeight += stone.weightPerPiece || stone.quantity || 0;
          }
        }
      }

      // Calculate weights using new formula: (paper weight per pc + stone weight as per design) * number of pieces
      const paperWeightPerPiece = paper.weightPerPiece;
      const totalWeightPerPiece = paperWeightPerPiece + designStoneWeight;
      const calculatedWeight = totalWeightPerPiece * paperUsed.quantityInPcs;

      // Validate inventory availability
      // Check paper availability
      if (paper.totalPieces < paperUsed.quantityInPcs) {
        inventoryErrors.push(
          `Insufficient paper stock: ${paperUsed.sizeInInch}" (available: ${paper.totalPieces}, required: ${paperUsed.quantityInPcs})`,
        );
      }

      // Validate stone availability for the design
      if (design.defaultStones && design.defaultStones.length > 0) {
        for (const designStone of design.defaultStones) {
          const stone = designStone.stoneId;
          const requiredQuantity = designStone.quantity * paperUsed.quantityInPcs; // Total stones needed for all pieces

          // Find the stone in the correct inventory type
          const inventoryStone = await Stone.findOne({
            _id: stone._id,
            inventoryType: inventoryType,
          });

          if (!inventoryStone) {
            inventoryErrors.push(
              `Stone "${stone.name}" not found in ${inventoryType} inventory`,
            );
          } else if (inventoryStone.quantity < requiredQuantity) {
            inventoryErrors.push(
              `Insufficient stone stock: ${stone.name} (available: ${inventoryStone.quantity}${inventoryStone.unit}, required: ${requiredQuantity}${inventoryStone.unit})`,
            );
          } else {
            stonesToDeduct.push({
              stoneId: inventoryStone._id,
              currentQuantity: inventoryStone.quantity,
              requiredQuantity: requiredQuantity,
            });
          }
        }
      }

      // Prepare stones used data for this design order
      const stonesUsed = design.defaultStones ? design.defaultStones.map((designStone: { stoneId: { _id: string }; quantity: number }) => ({
        stoneId: designStone.stoneId._id,
        quantity: designStone.quantity * paperUsed.quantityInPcs,
      })) : [];

      // Calculate pricing for this design order
      let unitPrice = 0;
      let totalPrice = 0;

      // Get design price (use first price if multiple exist)
      if (design.prices && design.prices.length > 0) {
        unitPrice = design.prices[0].price;
        totalPrice = unitPrice * paperUsed.quantityInPcs;
      }

      // Add to processed design orders
      processedDesignOrders.push({
        designId: design._id,
        quantity: paperUsed.quantityInPcs,
        stonesUsed,
        paperUsed: {
          ...paperUsed,
          paperWeightPerPc: paper.weightPerPiece,
        },
        calculatedWeight,
        unitPrice,
        totalPrice,
      });

      // Store paper for inventory deduction
      inventoryPapers.push({
        paper,
        requiredPieces: paperUsed.quantityInPcs,
      });
    }

    if (inventoryErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient inventory',
          errors: inventoryErrors,
        },
        { status: 400 },
      );
    }

    // Calculate total cost from all design orders
    const totalCost = processedDesignOrders.reduce((sum, designOrder) => {
      return sum + (designOrder.totalPrice || 0);
    }, 0);

    // Calculate discount
    let discountedAmount = 0;
    if (discountType === 'percentage') {
      discountedAmount = (totalCost * discountValue) / 100;
    } else {
      discountedAmount = discountValue;
    }
    const finalAmount = totalCost - discountedAmount;

    const orderData: CreateOrderData = {
      type,
      customerName,
      phone,
      customerId,
      gstNumber: gstNumber,
      designOrders: processedDesignOrders,
      modeOfPayment,
      paymentStatus,
      discountType,
      discountValue,
      discountedAmount,
      finalAmount,
      notes,
      createdBy: user.id,
    };

    // Deduct materials from inventory
    try {
      // Deduct paper inventory
      for (const { paper, requiredPieces } of inventoryPapers) {
        const remainingPieces = paper.totalPieces - requiredPieces;
        const newQuantity = Math.floor(remainingPieces / paper.piecesPerRoll);

        await Paper.findByIdAndUpdate(paper._id, {
          totalPieces: remainingPieces,
          quantity: newQuantity,
        });
      }

      // Deduct stone inventory
      for (const stoneDeduction of stonesToDeduct) {
        const newStoneQuantity = stoneDeduction.currentQuantity - stoneDeduction.requiredQuantity;
        await Stone.findByIdAndUpdate(stoneDeduction.stoneId, {
          quantity: newStoneQuantity,
        });
      }

      // Create the order
      order = new Order(orderData);
      await order.save();
    } catch (error) {
      // Rollback inventory changes if order creation failed
      if (order) {
        try {
          // Restore paper inventory to original state
          for (const { paper, requiredPieces } of inventoryPapers) {
            const restoredTotalPieces = paper.totalPieces + requiredPieces;
            const restoredQuantity = Math.floor(restoredTotalPieces / paper.piecesPerRoll);
            await Paper.findByIdAndUpdate(paper._id, {
              totalPieces: restoredTotalPieces,
              quantity: restoredQuantity,
            });
          }

          // Restore stone inventory to original state
          for (const stoneDeduction of stonesToDeduct) {
            await Stone.findByIdAndUpdate(stoneDeduction.stoneId, {
              quantity: stoneDeduction.currentQuantity,
            });
          }
        } catch (rollbackError) {
          console.error('Failed to rollback inventory changes:', rollbackError);
        }
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database connection failed. Please check if MongoDB is running.',
          },
          { status: 500 },
        );
      }
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database configuration error. Please check environment variables.',
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

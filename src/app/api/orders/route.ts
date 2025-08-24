import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import Design from '@/models/Design';
import { getCurrentUser } from '@/lib/auth';

// Type for creating orders via API
interface CreateOrderData {
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  designId: string;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
  };
  calculatedWeight: number;
  createdBy: string;
}

export async function GET() {
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

    const orders = await Order.find()
      .populate('designId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: orders,
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
  let inventoryPaper = null;
  let inventoryType = 'internal';
  let paperUsed = null;

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
      designId,
      paperUsed: bodyPaperUsed,
    } = body;

    if (!type || !customerName || !phone || !designId || !bodyPaperUsed) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    // Store for rollback
    paperUsed = bodyPaperUsed;
    inventoryType = type === 'out' ? 'out' : 'internal';

    // Get paper data to calculate weight
    const paper = await Paper.findOne({
      width: paperUsed.sizeInInch,
      inventoryType: inventoryType,
    });
    if (!paper) {
      return NextResponse.json(
        { success: false, message: 'Paper size not found in inventory' },
        { status: 400 },
      );
    }

    // Get design to calculate stone weights as per design
    const design = await Design.findById(designId);
    if (!design) {
      return NextResponse.json(
        { success: false, message: 'Design not found' },
        { status: 400 },
      );
    }

    // Calculate stone weight as per design (sum of all stone weights for the design)
    let designStoneWeight = 0;
    if (design.defaultStones && design.defaultStones.length > 0) {
      for (const designStone of design.defaultStones) {
        const stone = await Stone.findById(designStone.stoneId);
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

    const orderData: CreateOrderData = {
      type,
      customerName,
      phone,
      designId,
      paperUsed: {
        ...paperUsed,
        paperWeightPerPc: paper.weightPerPiece,
      },
      calculatedWeight,
      createdBy: user.id,
    };

    // Validate inventory availability before creating order
    const inventoryErrors = [];

    // Validate paper availability - check if we have enough total pieces (quantity * piecesPerRoll)
    inventoryPaper = await Paper.findOne({
      width: paperUsed.sizeInInch,
      inventoryType: inventoryType,
    });

    if (
      !inventoryPaper ||
      inventoryPaper.quantity * inventoryPaper.piecesPerRoll <
        paperUsed.quantityInPcs
    ) {
      inventoryErrors.push(
        `Insufficient paper stock: ${
          paperUsed.sizeInInch
        }" (available total pieces: ${
          inventoryPaper
            ? inventoryPaper.quantity * inventoryPaper.piecesPerRoll
            : 0
        }, required: ${paperUsed.quantityInPcs})`,
      );
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

    // Deduct materials from inventory
    try {
      // Calculate remaining pieces after deduction
      const currentTotalPieces =
        inventoryPaper.quantity * inventoryPaper.piecesPerRoll;
      const remainingPieces = currentTotalPieces - paperUsed.quantityInPcs;
      const newQuantity = Math.floor(
        remainingPieces / inventoryPaper.piecesPerRoll,
      );

      // Update paper inventory with new quantity (rolls)
      await Paper.findByIdAndUpdate(inventoryPaper._id, {
        quantity: newQuantity,
      });

      // Create the order
      order = new Order(orderData);
      await order.save();
    } catch (error) {
      // Rollback inventory changes if order creation failed
      if (order) {
        try {
          // Restore paper inventory to original state
          if (inventoryPaper && paperUsed) {
            const originalTotalPieces =
              inventoryPaper.quantity * inventoryPaper.piecesPerRoll;
            const restoredTotalPieces =
              originalTotalPieces + paperUsed.quantityInPcs;
            const restoredQuantity = Math.floor(
              restoredTotalPieces / inventoryPaper.piecesPerRoll,
            );
            await Paper.findByIdAndUpdate(inventoryPaper._id, {
              quantity: restoredQuantity,
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

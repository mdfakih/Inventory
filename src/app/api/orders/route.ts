import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find()
      .populate('designId')
      .populate('stonesUsed.stoneId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      customerName,
      phone,
      designId,
      stonesUsed,
      paperUsed,
    } = body;

    if (!type || !customerName || !phone || !designId || !stonesUsed || !paperUsed) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get paper data to calculate weight
    const paper = await Paper.findOne({ width: paperUsed.sizeInInch });
    if (!paper) {
      return NextResponse.json(
        { success: false, message: 'Paper size not found in inventory' },
        { status: 400 }
      );
    }

    // Calculate weights
    const paperWeight = paper.weightPerPiece * paperUsed.quantityInPcs;
    const stoneWeight = stonesUsed.reduce((total: number, stone: { quantity: number }) => {
      return total + (stone.quantity || 0);
    }, 0);
    const calculatedWeight = paperWeight + stoneWeight;

    const order = new Order({
      type,
      customerName,
      phone,
      designId,
      stonesUsed,
      paperUsed: {
        ...paperUsed,
        paperWeightPerPc: paper.weightPerPiece,
      },
      calculatedWeight,
      createdBy: user.id,
    });

    await order.save();

    // Update inventory for out jobs
    if (type === 'out') {
      for (const stoneUsage of stonesUsed) {
        await Stone.findByIdAndUpdate(
          stoneUsage.stoneId,
          { $inc: { quantity: -stoneUsage.quantity } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

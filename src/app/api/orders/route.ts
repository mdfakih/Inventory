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
      .populate('receivedMaterials.stones.stoneId')
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
      { status: 500 },
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
        { status: 401 },
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
      receivedMaterials,
    } = body;

    if (
      !type ||
      !customerName ||
      !phone ||
      !designId ||
      !stonesUsed ||
      !paperUsed
    ) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    // Get paper data to calculate weight
    const paper = await Paper.findOne({
      width: paperUsed.sizeInInch,
      inventoryType: type === 'out' ? 'out' : 'internal',
    });
    if (!paper) {
      return NextResponse.json(
        { success: false, message: 'Paper size not found in inventory' },
        { status: 400 },
      );
    }

    // Calculate weights
    const paperWeight = paper.weightPerPiece * paperUsed.quantityInPcs;
    const stoneWeight = stonesUsed.reduce(
      (total: number, stone: { quantity: number }) => {
        return total + (stone.quantity || 0);
      },
      0,
    );
    const calculatedWeight = paperWeight + stoneWeight;

    const orderData: any = {
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
    };

    // For out orders, track received materials
    if (type === 'out' && receivedMaterials) {
      orderData.receivedMaterials = receivedMaterials;
    }

    const order = new Order(orderData);
    await order.save();

    // For out orders, add received materials to out inventory
    if (type === 'out' && receivedMaterials) {
      // Add received stones to out inventory
      if (receivedMaterials.stones) {
        for (const stoneData of receivedMaterials.stones) {
          const existingStone = await Stone.findOne({
            number: stoneData.stoneId,
            inventoryType: 'out',
          });

          if (existingStone) {
            await Stone.findByIdAndUpdate(existingStone._id, {
              $inc: { quantity: stoneData.quantity },
            });
          } else {
            // Create new stone in out inventory
            const stone = await Stone.findById(stoneData.stoneId);
            if (stone) {
              await Stone.create({
                name: stone.name,
                number: stone.number,
                color: stone.color,
                size: stone.size,
                quantity: stoneData.quantity,
                unit: stone.unit,
                inventoryType: 'out',
              });
            }
          }
        }
      }

      // Add received paper to out inventory
      if (receivedMaterials.paper) {
        const existingPaper = await Paper.findOne({
          width: receivedMaterials.paper.sizeInInch,
          inventoryType: 'out',
        });

        if (existingPaper) {
          await Paper.findByIdAndUpdate(existingPaper._id, {
            $inc: { quantity: receivedMaterials.paper.quantityInPcs },
          });
        } else {
          // Create new paper in out inventory
          await Paper.create({
            width: receivedMaterials.paper.sizeInInch,
            quantity: receivedMaterials.paper.quantityInPcs,
            piecesPerRoll: 1, // Default for received paper
            weightPerPiece: receivedMaterials.paper.paperWeightPerPc,
            inventoryType: 'out',
          });
        }
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
      { status: 500 },
    );
  }
}

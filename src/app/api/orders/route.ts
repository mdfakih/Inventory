import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';

// Type for creating orders via API
interface CreateOrderData {
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  designId: string;
  stonesUsed: Array<{ stoneId: string; quantity: number }>;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
  };
  calculatedWeight: number;
  createdBy: string;
  receivedMaterials?: {
    stones: Array<{ stoneId: string; quantity: number }>;
    paper: {
      sizeInInch: number;
      quantityInPcs: number;
      paperWeightPerPc: number;
    };
  };
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
  let stonesUsed = null;

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
      stonesUsed: bodyStonesUsed,
      paperUsed: bodyPaperUsed,
      receivedMaterials,
    } = body;

    if (
      !type ||
      !customerName ||
      !phone ||
      !designId ||
      !bodyStonesUsed ||
      !bodyPaperUsed
    ) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    // Store for rollback
    paperUsed = bodyPaperUsed;
    stonesUsed = bodyStonesUsed;
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

    // Calculate weights
    const paperWeight = paper.weightPerPiece * paperUsed.quantityInPcs;
    const stoneWeight = stonesUsed.reduce(
      (total: number, stone: { quantity: number }) => {
        return total + (stone.quantity || 0);
      },
      0,
    );
    const calculatedWeight = paperWeight + stoneWeight;

    const orderData: CreateOrderData = {
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
      ...(type === 'out' && receivedMaterials && { receivedMaterials }),
    };

    // Validate inventory availability before creating order
    const inventoryErrors = [];

    // Validate paper availability
    inventoryPaper = await Paper.findOne({
      width: paperUsed.sizeInInch,
      inventoryType: inventoryType,
    });

    if (!inventoryPaper || inventoryPaper.quantity < paperUsed.quantityInPcs) {
      inventoryErrors.push(
        `Insufficient paper stock: ${paperUsed.sizeInInch}" (available: ${
          inventoryPaper?.quantity || 0
        }, required: ${paperUsed.quantityInPcs})`,
      );
    }

    // Validate stone availability
    for (const stoneUsage of stonesUsed) {
      const stone = await Stone.findById(stoneUsage.stoneId);
      if (!stone) {
        inventoryErrors.push(`Stone not found: ${stoneUsage.stoneId}`);
        continue;
      }

      const inventoryStone = await Stone.findOne({
        number: stone.number,
        inventoryType: inventoryType,
      });

      if (!inventoryStone || inventoryStone.quantity < stoneUsage.quantity) {
        inventoryErrors.push(
          `Insufficient stone stock: ${stone.name} (available: ${
            inventoryStone?.quantity || 0
          }, required: ${stoneUsage.quantity})`,
        );
      }
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
      // Deduct paper from inventory
      await Paper.findByIdAndUpdate(inventoryPaper._id, {
        $inc: { quantity: -paperUsed.quantityInPcs },
      });

      // Deduct stones from inventory
      for (const stoneUsage of stonesUsed) {
        const stone = await Stone.findById(stoneUsage.stoneId);
        const inventoryStone = await Stone.findOne({
          number: stone.number,
          inventoryType: inventoryType,
        });

        await Stone.findByIdAndUpdate(inventoryStone._id, {
          $inc: { quantity: -stoneUsage.quantity },
        });
      }

      // Create the order
      order = new Order(orderData);
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
    } catch (error) {
      // Rollback inventory changes if order creation failed
      if (order) {
        try {
          // Restore paper inventory
          if (inventoryPaper && paperUsed) {
            await Paper.findByIdAndUpdate(inventoryPaper._id, {
              $inc: { quantity: paperUsed.quantityInPcs },
            });
          }

          // Restore stone inventory
          if (stonesUsed) {
            for (const stoneUsage of stonesUsed) {
              const stone = await Stone.findById(stoneUsage.stoneId);
              if (stone) {
                const inventoryStone = await Stone.findOne({
                  number: stone.number,
                  inventoryType: inventoryType,
                });

                if (inventoryStone) {
                  await Stone.findByIdAndUpdate(inventoryStone._id, {
                    $inc: { quantity: stoneUsage.quantity },
                  });
                }
              }
            }
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

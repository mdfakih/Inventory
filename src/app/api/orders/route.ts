import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import Plastic from '@/models/Plastic';
import Tape from '@/models/Tape';
import Design from '@/models/Design';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

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
    otherItemsUsed?: Array<{
      itemType: 'plastic' | 'tape' | 'other';
      itemId: string;
      quantity: number;
      unit?: string;
    }>;
  }>;
  modeOfPayment: 'cash' | 'UPI' | 'card';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountedAmount: number;
  finalAmount: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
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

    const dbConnection = await dbConnect();

    // Verify database connection is ready
    if (!dbConnection || dbConnection.connection.readyState !== 1) {
      console.error(
        'Database connection not ready, readyState:',
        dbConnection?.connection.readyState,
      );
      return NextResponse.json(
        { success: false, message: 'Database connection not ready' },
        { status: 500 },
      );
    }

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
    requiredPieces: number;
  }> = [];
  const inventoryOtherItems: Array<{
    itemType: string;
    itemId: string;
    currentQuantity: number;
    requiredQuantity: number;
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

    if (
      !type ||
      !customerName ||
      !phone ||
      !designOrders ||
      !Array.isArray(designOrders) ||
      designOrders.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Order type, customer details, and at least one design order are required',
        },
        { status: 400 },
      );
    }

    // Handle customer creation if customerId is not provided
    let finalCustomerId = customerId;
    if (!customerId) {
      try {
        // First try to find existing customer by phone
        let customer = await Customer.findOne({ phone: phone.trim() });

        if (customer) {
          // Update customer if new information is provided
          const updates: Partial<{
            name: string;
            gstNumber: string;
            updatedBy: mongoose.Types.ObjectId;
            updateHistory: Array<{
              field: string;
              oldValue: unknown;
              newValue: unknown;
              updatedBy: mongoose.Types.ObjectId;
              updatedAt: Date;
            }>;
          }> = {};
          let hasUpdates = false;

          if (customerName && customerName !== customer.name) {
            updates.name = customerName.trim();
            hasUpdates = true;
          }

          if (gstNumber && gstNumber !== customer.gstNumber) {
            updates.gstNumber = gstNumber?.trim() || undefined;
            hasUpdates = true;
          }

          if (hasUpdates) {
            updates.updatedBy = new mongoose.Types.ObjectId(user._id);
            updates.updateHistory = [
              ...(customer.updateHistory || []),
              {
                field: 'order_update',
                oldValue: 'Customer updated via order',
                newValue: 'Customer updated via order',
                updatedBy: new mongoose.Types.ObjectId(user._id),
                updatedAt: new Date(),
              },
            ];

            customer = await Customer.findByIdAndUpdate(customer._id, updates, {
              new: true,
              runValidators: true,
            });
          }

          finalCustomerId = customer?._id;
        } else {
          // Create new customer
          const newCustomer = new Customer({
            name: customerName.trim(),
            phone: phone.trim(),
            gstNumber: gstNumber?.trim() || undefined,
            customerType: 'retail', // Default type
            creditLimit: 0,
            paymentTerms: 'immediate',
            isActive: true,
            createdBy: new mongoose.Types.ObjectId(user._id),
            updateHistory: [
              {
                field: 'created',
                oldValue: null,
                newValue: 'Customer created via order',
                updatedBy: new mongoose.Types.ObjectId(user._id),
                updatedAt: new Date(),
              },
            ],
          });

          await newCustomer.save();
          finalCustomerId = newCustomer._id;
        }
      } catch (error) {
        console.error('Error handling customer creation:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to process customer information' },
          { status: 500 },
        );
      }
    }

    inventoryType = type === 'out' ? 'out' : 'internal';

    // Validate and process each design order
    const processedDesignOrders = [];
    const inventoryErrors = [];
    const stonesToDeduct = [];

    // Define interfaces and type guards at the top level
    interface PopulatedStone {
      _id: mongoose.Types.ObjectId | string;
      name: string;
      inventoryType: string;
    }

    // Type guard to check if stone is populated
    function isPopulatedStone(obj: unknown): obj is PopulatedStone {
      return (
        obj !== null &&
        typeof obj === 'object' &&
        'name' in obj &&
        'inventoryType' in obj &&
        '_id' in obj
      );
    }

    for (const designOrder of designOrders) {
      const { designId, paperUsed } = designOrder;

      if (
        !designId ||
        !paperUsed ||
        !paperUsed.sizeInInch ||
        !paperUsed.quantityInPcs
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Each design order must have designId and paper details',
          },
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
          {
            success: false,
            message: `Paper size ${paperUsed.sizeInInch}" not found in ${inventoryType} inventory`,
          },
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
          if (!isPopulatedStone(stone)) {
            return NextResponse.json(
              {
                success: false,
                message: 'Design contains unpopulated stone references',
              },
              { status: 400 },
            );
          }

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
          // Use designStone.quantity directly as it represents the weight of this stone used in the design
          designStoneWeight += designStone.quantity || 0;
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

          // Validate design stone quantity meets minimum requirement
          if (designStone.quantity < 0.1) {
            const stoneName = isPopulatedStone(stone)
              ? stone.name
              : 'Unknown Stone';
            inventoryErrors.push(
              `Invalid stone quantity in design: ${stoneName} (${designStone.quantity}g) - must be at least 0.1g`,
            );
            continue;
          }

          const requiredQuantity =
            designStone.quantity * paperUsed.quantityInPcs; // Total stones needed for all pieces

          // Find the stone in the correct inventory type
          const inventoryStone = await Stone.findOne({
            _id: stone._id,
            inventoryType: inventoryType,
          });

          if (!inventoryStone) {
            const stoneName = isPopulatedStone(stone)
              ? stone.name
              : 'Unknown Stone';
            inventoryErrors.push(
              `Stone "${stoneName}" not found in ${inventoryType} inventory`,
            );
          } else if (inventoryStone.quantity < requiredQuantity) {
            const stoneName = isPopulatedStone(stone)
              ? stone.name
              : 'Unknown Stone';
            inventoryErrors.push(
              `Insufficient stone stock: ${stoneName} (available: ${inventoryStone.quantity}${inventoryStone.unit}, required: ${requiredQuantity}${inventoryStone.unit})`,
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

      // Validate other inventory items if provided
      const otherItemsToDeduct: Array<{
        itemType: string;
        itemId: string;
        currentQuantity: number;
        requiredQuantity: number;
      }> = [];

      if (designOrder.otherItemsUsed && designOrder.otherItemsUsed.length > 0) {
        for (const item of designOrder.otherItemsUsed) {
          let inventoryItem;

          // Find the item in the appropriate collection based on itemType
          switch (item.itemType) {
            case 'plastic':
              inventoryItem = await Plastic.findById(item.itemId);
              break;
            case 'tape':
              inventoryItem = await Tape.findById(item.itemId);
              break;
            default:
              inventoryErrors.push(`Unknown item type: ${item.itemType}`);
              continue;
          }

          if (!inventoryItem) {
            inventoryErrors.push(
              `${
                item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)
              } item not found`,
            );
          } else if (inventoryItem.quantity < item.quantity) {
            inventoryErrors.push(
              `Insufficient ${item.itemType} stock: ${
                inventoryItem.name
              } (available: ${inventoryItem.quantity}${
                inventoryItem.unit || 'pcs'
              }, required: ${item.quantity}${item.unit || 'pcs'})`,
            );
          } else {
            otherItemsToDeduct.push({
              itemType: item.itemType,
              itemId: inventoryItem._id.toString(),
              currentQuantity: inventoryItem.quantity,
              requiredQuantity: item.quantity,
            });
          }
        }
      }

      // Prepare stones used data for this design order
      interface DesignStone {
        stoneId: PopulatedStone | mongoose.Types.ObjectId | string;
        quantity: number;
      }
      const stonesUsed = design.defaultStones
        ? design.defaultStones.map((designStone: DesignStone) => ({
            stoneId: isPopulatedStone(designStone.stoneId)
              ? designStone.stoneId._id.toString()
              : designStone.stoneId.toString(),
            quantity: designStone.quantity * paperUsed.quantityInPcs,
          }))
        : [];

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
        designId: design._id.toString(),
        quantity: paperUsed.quantityInPcs,
        stonesUsed,
        otherItemsUsed: designOrder.otherItemsUsed || [],
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
        paper: {
          _id: paper._id.toString(),
          totalPieces: paper.totalPieces,
          piecesPerRoll: paper.piecesPerRoll,
          weightPerPiece: paper.weightPerPiece,
        },
        requiredPieces: paperUsed.quantityInPcs,
      });

      // Store other items for inventory deduction
      if (otherItemsToDeduct.length > 0) {
        inventoryOtherItems.push(...otherItemsToDeduct);
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
      customerId: finalCustomerId,
      gstNumber: gstNumber,
      designOrders: processedDesignOrders,
      modeOfPayment,
      paymentStatus,
      discountType,
      discountValue,
      discountedAmount,
      finalAmount,
      notes,
      createdBy: new mongoose.Types.ObjectId(user._id),
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
        const newStoneQuantity =
          stoneDeduction.currentQuantity - stoneDeduction.requiredQuantity;
        await Stone.findByIdAndUpdate(stoneDeduction.stoneId, {
          quantity: newStoneQuantity,
        });
      }

      // Deduct other inventory items
      for (const itemDeduction of inventoryOtherItems) {
        const newItemQuantity =
          itemDeduction.currentQuantity - itemDeduction.requiredQuantity;

        switch (itemDeduction.itemType) {
          case 'plastic':
            await Plastic.findByIdAndUpdate(itemDeduction.itemId, {
              quantity: newItemQuantity,
            });
            break;
          case 'tape':
            await Tape.findByIdAndUpdate(itemDeduction.itemId, {
              quantity: newItemQuantity,
            });
            break;
        }
      }

      // Create the order
      order = new Order(orderData);
      await order.save();
    } catch (error) {
      // Rollback inventory changes if any step failed
      try {
        // Restore paper inventory to original state
        for (const { paper, requiredPieces } of inventoryPapers) {
          const restoredTotalPieces = paper.totalPieces + requiredPieces;
          const restoredQuantity = Math.floor(
            restoredTotalPieces / paper.piecesPerRoll,
          );
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

        // Restore other inventory items to original state
        for (const itemDeduction of inventoryOtherItems) {
          switch (itemDeduction.itemType) {
            case 'plastic':
              await Plastic.findByIdAndUpdate(itemDeduction.itemId, {
                quantity: itemDeduction.currentQuantity,
              });
              break;
            case 'tape':
              await Tape.findByIdAndUpdate(itemDeduction.itemId, {
                quantity: itemDeduction.currentQuantity,
              });
              break;
          }
        }
      } catch (rollbackError) {
        console.error('Failed to rollback inventory changes:', rollbackError);
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

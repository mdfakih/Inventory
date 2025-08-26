import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID format' },
        { status: 400 },
      );
    }

    const order = await Order.findById(id)
      .populate('designOrders.designId')
      .populate('designOrders.stonesUsed.stoneId')
      .populate('designId') // Legacy field
      .populate('stonesUsed.stoneId') // Legacy field
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      customerId,
      gstNumber,
      designOrders,
      finalTotalWeight,
      status,
      isFinalized,
      modeOfPayment,
      paymentStatus,
      discountType,
      discountValue,
      notes,
    } = body;
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID format' },
        { status: 400 },
      );
    }

    const order = await Order.findById(id).populate('designOrders.designId');
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 },
      );
    }

    // Track changes for audit trail
    const updateHistory = [];
    const oldValues = order.toObject();
    const updateData: Record<string, unknown> = {};

    // Check for changes and add to history
    if (type !== undefined && type !== oldValues.type) {
      updateHistory.push({
        field: 'type',
        oldValue: oldValues.type,
        newValue: type,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (customerName !== undefined && customerName !== oldValues.customerName) {
      updateHistory.push({
        field: 'customerName',
        oldValue: oldValues.customerName,
        newValue: customerName,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (phone !== undefined && phone !== oldValues.phone) {
      updateHistory.push({
        field: 'phone',
        oldValue: oldValues.phone,
        newValue: phone,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (customerId !== undefined && customerId !== oldValues.customerId?.toString()) {
      updateHistory.push({
        field: 'customerId',
        oldValue: oldValues.customerId,
        newValue: customerId,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (gstNumber !== undefined && gstNumber !== oldValues.gstNumber) {
      updateHistory.push({
        field: 'gstNumber',
        oldValue: oldValues.gstNumber,
        newValue: gstNumber,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (status !== undefined && status !== oldValues.status) {
      updateHistory.push({
        field: 'status',
        oldValue: oldValues.status,
        newValue: status,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    // Handle design orders updates
    let totalCalculatedWeight = order.calculatedWeight || 0;
    let totalCost = order.totalCost || 0;
    
    if (designOrders && Array.isArray(designOrders)) {
      updateHistory.push({
        field: 'designOrders',
        oldValue: oldValues.designOrders,
        newValue: designOrders,
        updatedBy: user.id,
        updatedAt: new Date(),
      });

      // Process design orders and calculate totals
      const processedDesignOrders = [];
      totalCalculatedWeight = 0;
      totalCost = 0;

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
          inventoryType: type === 'out' ? 'out' : 'internal',
        });
        if (!paper) {
          return NextResponse.json(
            { success: false, message: `Paper size ${paperUsed.sizeInInch}" not found in ${type === 'out' ? 'out' : 'internal'} inventory` },
            { status: 400 },
          );
        }

        // Get design to calculate stone weights as per design
        const Design = await import('@/models/Design').then((m) => m.default);
        const design = await Design.findById(designId).populate('defaultStones.stoneId');
        if (!design) {
          return NextResponse.json(
            { success: false, message: 'Design not found' },
            { status: 400 },
          );
        }

        // Calculate stone weight as per design
        let designStoneWeight = 0;
        if (design.defaultStones && design.defaultStones.length > 0) {
          for (const designStone of design.defaultStones) {
            const stone = designStone.stoneId;
            if (stone) {
              designStoneWeight += stone.weightPerPiece || stone.quantity || 0;
            }
          }
        }

        // Calculate weights
        const paperWeightPerPiece = paper.weightPerPiece;
        const totalWeightPerPiece = paperWeightPerPiece + designStoneWeight;
        const calculatedWeight = totalWeightPerPiece * paperUsed.quantityInPcs;

        // Calculate pricing
        let unitPrice = 0;
        let totalPrice = 0;
        if (design.prices && design.prices.length > 0) {
          unitPrice = design.prices[0].price;
          totalPrice = unitPrice * paperUsed.quantityInPcs;
        }

        // Prepare stones used data
        const stonesUsed = design.defaultStones ? design.defaultStones.map((designStone: { stoneId: { _id: string }; quantity: number }) => ({
          stoneId: designStone.stoneId._id,
          quantity: designStone.quantity * paperUsed.quantityInPcs,
        })) : [];

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

        totalCalculatedWeight += calculatedWeight;
        totalCost += totalPrice;
      }

      updateData.designOrders = processedDesignOrders;
      updateData.calculatedWeight = totalCalculatedWeight;
      updateData.totalCost = totalCost;
    }

    // Calculate pricing if payment or discount fields changed
    let discountedAmount = order.discountedAmount || 0;
    let finalAmount = order.finalAmount || 0;

    if (modeOfPayment !== undefined || paymentStatus !== undefined || discountType !== undefined || discountValue !== undefined) {
      if (modeOfPayment !== undefined && modeOfPayment !== oldValues.modeOfPayment) {
        updateHistory.push({
          field: 'modeOfPayment',
          oldValue: oldValues.modeOfPayment,
          newValue: modeOfPayment,
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }

      if (paymentStatus !== undefined && paymentStatus !== oldValues.paymentStatus) {
        updateHistory.push({
          field: 'paymentStatus',
          oldValue: oldValues.paymentStatus,
          newValue: paymentStatus,
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }

      if (discountType !== undefined && discountType !== oldValues.discountType) {
        updateHistory.push({
          field: 'discountType',
          oldValue: oldValues.discountType,
          newValue: discountType,
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }

      if (discountValue !== undefined && discountValue !== oldValues.discountValue) {
        updateHistory.push({
          field: 'discountValue',
          oldValue: oldValues.discountValue,
          newValue: discountValue,
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }

      // Calculate discount
      if (discountType === 'percentage') {
        discountedAmount = (totalCost * (discountValue || 0)) / 100;
      } else {
        discountedAmount = discountValue || 0;
      }
      
      finalAmount = totalCost - discountedAmount;
      
      updateData.discountedAmount = discountedAmount;
      updateData.finalAmount = finalAmount;
    }

    // Calculate discrepancy if final weight is provided or if order is being completed
    let effectiveFinalWeight: number | undefined;
    if (finalTotalWeight !== undefined || status === 'completed') {
      // If finalTotalWeight is not provided but order is being completed, use calculated weight as final weight
      effectiveFinalWeight = finalTotalWeight !== undefined ? finalTotalWeight : totalCalculatedWeight;

      const weightDiscrepancy = effectiveFinalWeight! - totalCalculatedWeight;
      const discrepancyPercentage = totalCalculatedWeight > 0 ? (weightDiscrepancy / totalCalculatedWeight) * 100 : 0;

      // Add discrepancy calculation to history
      updateHistory.push({
        field: 'weightDiscrepancy',
        oldValue: oldValues.weightDiscrepancy,
        newValue: weightDiscrepancy,
        updatedBy: user.id,
        updatedAt: new Date(),
      });

      updateHistory.push({
        field: 'discrepancyPercentage',
        oldValue: oldValues.discrepancyPercentage,
        newValue: discrepancyPercentage,
        updatedBy: user.id,
        updatedAt: new Date(),
      });

      updateHistory.push({
        field: 'finalTotalWeight',
        oldValue: oldValues.finalTotalWeight,
        newValue: effectiveFinalWeight,
        updatedBy: user.id,
        updatedAt: new Date(),
      });

      updateData.weightDiscrepancy = weightDiscrepancy;
      updateData.discrepancyPercentage = discrepancyPercentage;
      updateData.finalTotalWeight = effectiveFinalWeight;
    }

    // Handle order finalization for out orders
    if (isFinalized && !order.isFinalized && order.type === 'out') {
      updateHistory.push({
        field: 'isFinalized',
        oldValue: false,
        newValue: true,
        updatedBy: user.id,
        updatedAt: new Date(),
      });

      updateData.isFinalized = true;
      updateData.finalizedAt = new Date();
    }

    // Update basic fields
    if (type !== undefined) updateData.type = type;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (phone !== undefined) updateData.phone = phone;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (modeOfPayment !== undefined) updateData.modeOfPayment = modeOfPayment;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;

    updateData.updatedBy = user.id;

    // Add to existing history
    updateData.updateHistory = [
      ...(order.updateHistory || []),
      ...updateHistory,
    ];

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('designOrders.designId')
      .populate('designOrders.stonesUsed.stoneId')
      .populate('designId') // Legacy field
      .populate('stonesUsed.stoneId') // Legacy field
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Only admin can delete orders
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admin can delete orders' },
        { status: 403 },
      );
    }
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID format' },
        { status: 400 },
      );
    }

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

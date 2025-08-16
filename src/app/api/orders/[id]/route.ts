import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await Order.findById(id)
      .populate('designId')
      .populate('stonesUsed.stoneId')
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
      designId,
      stonesUsed,
      paperUsed,
      finalTotalWeight,
      status,
    } = body;
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 },
      );
    }

    // Track changes for audit trail
    const updateHistory = [];
    const oldValues = order.toObject();

    // Check for changes and add to history
    if (type !== oldValues.type) {
      updateHistory.push({
        field: 'type',
        oldValue: oldValues.type,
        newValue: type,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (customerName !== oldValues.customerName) {
      updateHistory.push({
        field: 'customerName',
        oldValue: oldValues.customerName,
        newValue: customerName,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (phone !== oldValues.phone) {
      updateHistory.push({
        field: 'phone',
        oldValue: oldValues.phone,
        newValue: phone,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (designId !== oldValues.designId.toString()) {
      updateHistory.push({
        field: 'designId',
        oldValue: oldValues.designId,
        newValue: designId,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (status !== oldValues.status) {
      updateHistory.push({
        field: 'status',
        oldValue: oldValues.status,
        newValue: status,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    // Calculate new weights if paper or stones changed
    let calculatedWeight = order.calculatedWeight;
    let weightDiscrepancy = 0;
    let discrepancyPercentage = 0;

    if (
      paperUsed &&
      (paperUsed.sizeInInch !== oldValues.paperUsed.sizeInInch ||
        paperUsed.quantityInPcs !== oldValues.paperUsed.quantityInPcs)
    ) {
      const paper = await Paper.findOne({ width: paperUsed.sizeInInch });
      if (paper) {
        const paperWeight = paper.weightPerPiece * paperUsed.quantityInPcs;
        const stoneWeight = stonesUsed.reduce(
          (total: number, stone: { quantity: number }) => {
            return total + (stone.quantity || 0);
          },
          0,
        );
        calculatedWeight = paperWeight + stoneWeight;

        updateHistory.push({
          field: 'paperUsed',
          oldValue: oldValues.paperUsed,
          newValue: { ...paperUsed, paperWeightPerPc: paper.weightPerPiece },
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }
    }

    if (
      stonesUsed &&
      JSON.stringify(stonesUsed) !== JSON.stringify(oldValues.stonesUsed)
    ) {
      const paper = await Paper.findOne({
        width: paperUsed?.sizeInInch || oldValues.paperUsed.sizeInInch,
      });
      if (paper) {
        const paperWeight =
          paper.weightPerPiece *
          (paperUsed?.quantityInPcs || oldValues.paperUsed.quantityInPcs);
        const stoneWeight = stonesUsed.reduce(
          (total: number, stone: { quantity: number }) => {
            return total + (stone.quantity || 0);
          },
          0,
        );
        calculatedWeight = paperWeight + stoneWeight;

        updateHistory.push({
          field: 'stonesUsed',
          oldValue: oldValues.stonesUsed,
          newValue: stonesUsed,
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }
    }

    // Calculate discrepancy if final weight is provided
    if (finalTotalWeight !== undefined) {
      weightDiscrepancy = finalTotalWeight - calculatedWeight;
      discrepancyPercentage =
        calculatedWeight > 0 ? (weightDiscrepancy / calculatedWeight) * 100 : 0;

      updateHistory.push({
        field: 'finalTotalWeight',
        oldValue: oldValues.finalTotalWeight,
        newValue: finalTotalWeight,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    // Update order
    const updateData: Record<string, unknown> = {
      type,
      customerName,
      phone,
      designId,
      stonesUsed,
      paperUsed: paperUsed
        ? {
            ...paperUsed,
            paperWeightPerPc: (
              await Paper.findOne({ width: paperUsed.sizeInInch })
            )?.weightPerPiece,
          }
        : order.paperUsed,
      calculatedWeight,
      weightDiscrepancy,
      discrepancyPercentage,
      status,
      updatedBy: user.id,
    };

    if (finalTotalWeight !== undefined) {
      updateData.finalTotalWeight = finalTotalWeight;
    }

    // Add to existing history
    updateData.updateHistory = [
      ...(order.updateHistory || []),
      ...updateHistory,
    ];

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('designId')
      .populate('stonesUsed.stoneId')
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

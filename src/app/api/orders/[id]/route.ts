import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Paper from '@/models/Paper';
import Stone from '@/models/Stone';
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
      .populate('designId')
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
      paperUsed,
      finalTotalWeight,
      status,
      isFinalized,
    } = body;
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID format' },
        { status: 400 },
      );
    }

    const order = await Order.findById(id).populate('stonesUsed.stoneId');
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
    let inventoryChanged = false;
    const inventoryAdjustments = [];
    const stoneInventoryAdjustments = [];

    // Check if paper usage changed
    if (
      paperUsed &&
      (paperUsed.sizeInInch !== oldValues.paperUsed.sizeInInch ||
        paperUsed.quantityInPcs !== oldValues.paperUsed.quantityInPcs)
    ) {
      const paper = await Paper.findOne({
        width: paperUsed.sizeInInch,
        inventoryType: type === 'out' ? 'out' : 'internal',
      });
      if (paper) {
        // Get design to calculate stone weights as per design
        const Design = await import('@/models/Design').then((m) => m.default);
        const design = await Design.findById(designId);
        if (design) {
          // Calculate stone weight as per design (sum of all stone weights for the design)
          let designStoneWeight = 0;
          if (design.defaultStones && design.defaultStones.length > 0) {
            for (const designStone of design.defaultStones) {
              const stone = await Stone.findById(designStone.stoneId);
              if (stone) {
                // Use weightPerPiece if available, otherwise use quantity as fallback
                designStoneWeight +=
                  stone.weightPerPiece || stone.quantity || 0;
              }
            }
          }

          // Calculate weights using new formula: (paper weight per pc + stone weight as per design) * number of pieces
          const paperWeightPerPiece = paper.weightPerPiece;
          const totalWeightPerPiece = paperWeightPerPiece + designStoneWeight;
          calculatedWeight = totalWeightPerPiece * paperUsed.quantityInPcs;
        }

        // Calculate paper inventory adjustment - using quantity (rolls)
        const paperDiff =
          paperUsed.quantityInPcs - oldValues.paperUsed.quantityInPcs;
        if (paperDiff !== 0) {
          inventoryChanged = true;
          inventoryAdjustments.push({
            type: 'paper',
            oldQuantity: oldValues.paperUsed.quantityInPcs,
            newQuantity: paperUsed.quantityInPcs,
            difference: paperDiff,
            paperId: paper._id,
          });
        }

        updateHistory.push({
          field: 'paperUsed',
          oldValue: oldValues.paperUsed,
          newValue: { ...paperUsed, paperWeightPerPc: paper.weightPerPiece },
          updatedBy: user.id,
          updatedAt: new Date(),
        });
      }
    }

    // Calculate discrepancy if final weight is provided or if order is being completed
    let effectiveFinalWeight: number | undefined;
    if (finalTotalWeight !== undefined || status === 'completed') {
      // If finalTotalWeight is not provided but order is being completed, use calculated weight as final weight
      effectiveFinalWeight =
        finalTotalWeight !== undefined ? finalTotalWeight : calculatedWeight;

      weightDiscrepancy = effectiveFinalWeight! - calculatedWeight;
      discrepancyPercentage =
        calculatedWeight > 0 ? (weightDiscrepancy / calculatedWeight) * 100 : 0;

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
    }

    // Validate and adjust inventory if changes were made
    if (inventoryChanged) {
      const inventoryErrors = [];

      // Validate paper availability - check total pieces
      for (const adjustment of inventoryAdjustments.filter(
        (a) => a.type === 'paper',
      )) {
        if (adjustment.difference > 0) {
          const paper = await Paper.findById(adjustment.paperId);
          if (!paper || paper.totalPieces < adjustment.difference) {
            inventoryErrors.push(
              `Insufficient paper stock: ${
                paper?.width || 'Unknown'
              }" (available total pieces: ${
                paper?.totalPieces || 0
              }, required: ${adjustment.difference})`,
            );
          }
        }
      }

      // Validate stone availability if design changed
      if (designId !== oldValues.designId.toString()) {
        const Design = await import('@/models/Design').then((m) => m.default);
        const newDesign = await Design.findById(designId).populate(
          'defaultStones.stoneId',
        );

        if (
          newDesign &&
          newDesign.defaultStones &&
          newDesign.defaultStones.length > 0
        ) {
          for (const designStone of newDesign.defaultStones) {
            const stone = designStone.stoneId;
            if (!stone) continue;

            // Check if stone is available in the correct inventory type
            if (stone.inventoryType !== (type === 'out' ? 'out' : 'internal')) {
              inventoryErrors.push(
                `Design not applicable for ${type} orders. Stone "${stone.name}" is only available in ${stone.inventoryType} inventory.`,
              );
              continue;
            }

            const requiredQuantity =
              designStone.quantity * paperUsed.quantityInPcs;
            const inventoryStone = await Stone.findOne({
              _id: stone._id,
              inventoryType: type === 'out' ? 'out' : 'internal',
            });

            if (!inventoryStone) {
              inventoryErrors.push(
                `Stone "${stone.name}" not found in ${type} inventory`,
              );
            } else if (inventoryStone.quantity < requiredQuantity) {
              inventoryErrors.push(
                `Insufficient stone stock: ${stone.name} (available: ${inventoryStone.quantity}${inventoryStone.unit}, required: ${requiredQuantity}${inventoryStone.unit})`,
              );
            } else {
              stoneInventoryAdjustments.push({
                stoneId: inventoryStone._id,
                currentQuantity: inventoryStone.quantity,
                requiredQuantity: requiredQuantity,
              });
            }
          }
        }
      }

      if (inventoryErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Insufficient inventory for changes',
            errors: inventoryErrors,
          },
          { status: 400 },
        );
      }

      // Apply inventory adjustments
      try {
        for (const adjustment of inventoryAdjustments) {
          if (adjustment.type === 'paper') {
            const paper = await Paper.findById(adjustment.paperId);
            if (paper) {
              // Calculate new total pieces after adjustment
              const newTotalPieces = paper.totalPieces - adjustment.difference;

              // Calculate new quantity (rolls) based on remaining pieces
              const newQuantity = Math.floor(
                newTotalPieces / paper.piecesPerRoll,
              );

              await Paper.findByIdAndUpdate(adjustment.paperId, {
                totalPieces: newTotalPieces,
                quantity: newQuantity,
              });
            }
          }
        }

        // Apply stone inventory adjustments
        for (const stoneAdjustment of stoneInventoryAdjustments) {
          const newStoneQuantity =
            stoneAdjustment.currentQuantity - stoneAdjustment.requiredQuantity;
          await Stone.findByIdAndUpdate(stoneAdjustment.stoneId, {
            quantity: newStoneQuantity,
          });
        }
      } catch (error) {
        console.error('Failed to adjust inventory:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to adjust inventory' },
          { status: 500 },
        );
      }
    }

    // Handle order finalization for out orders
    if (isFinalized && !order.isFinalized && order.type === 'out') {
      // Deduct consumed materials from out inventory

      // Deduct consumed paper from out inventory - using pieces
      const outPaper = await Paper.findOne({
        width: paperUsed.sizeInInch,
        inventoryType: 'out',
      });
      if (outPaper) {
        // Calculate remaining pieces after deduction
        const remainingPieces = outPaper.totalPieces - paperUsed.quantityInPcs;
        const newQuantity = Math.floor(
          remainingPieces / outPaper.piecesPerRoll,
        );

        await Paper.findByIdAndUpdate(outPaper._id, {
          totalPieces: remainingPieces,
          quantity: newQuantity,
        });
      }

      // Deduct consumed stones from out inventory
      if (order.stonesUsed && order.stonesUsed.length > 0) {
        for (const orderStone of order.stonesUsed) {
          const outStone = await Stone.findOne({
            _id: orderStone.stoneId._id,
            inventoryType: 'out',
          });
          if (outStone) {
            const newStoneQuantity = outStone.quantity - orderStone.quantity;
            await Stone.findByIdAndUpdate(outStone._id, {
              quantity: newStoneQuantity,
            });
          }
        }
      }

      updateHistory.push({
        field: 'isFinalized',
        oldValue: false,
        newValue: true,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    // Prepare stones used data if design changed
    let stonesUsed = order.stonesUsed;
    if (
      designId !== oldValues.designId.toString() &&
      stoneInventoryAdjustments.length > 0
    ) {
      stonesUsed = stoneInventoryAdjustments.map((stoneAdjustment) => ({
        stoneId: stoneAdjustment.stoneId,
        quantity: stoneAdjustment.requiredQuantity,
      }));
    }

    // Update order
    Object.assign(updateData, {
      type,
      customerName,
      phone,
      designId,
      stonesUsed,
      paperUsed: paperUsed
        ? {
            ...paperUsed,
            paperWeightPerPc: (
              await Paper.findOne({
                width: paperUsed.sizeInInch,
                inventoryType: type === 'out' ? 'out' : 'internal',
              })
            )?.weightPerPiece,
          }
        : order.paperUsed,
      calculatedWeight,
      weightDiscrepancy,
      discrepancyPercentage,
      status,
      updatedBy: user.id,
    });

    if (finalTotalWeight !== undefined || status === 'completed') {
      updateData.finalTotalWeight = effectiveFinalWeight!;
    }

    if (isFinalized && !order.isFinalized) {
      updateData.isFinalized = true;
      updateData.finalizedAt = new Date();
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

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Stone from '@/models/Stone';
import { getCurrentUser } from '@/lib/auth';

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

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can edit master data' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, number, color, size, unit, inventoryType } = body;

    if (!name || !number || !color || !size || !unit || !inventoryType) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    // Validate unit
    if (!['g', 'kg'].includes(unit)) {
      return NextResponse.json(
        { success: false, message: 'Unit must be either "g" or "kg"' },
        { status: 400 },
      );
    }

    // Validate inventory type
    if (!['internal', 'out'].includes(inventoryType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
    }

    const stone = await Stone.findById(id);
    if (!stone) {
      return NextResponse.json(
        { success: false, message: 'Stone not found' },
        { status: 404 },
      );
    }

    // Check if name and number already exists for the same inventory type (excluding current stone)
    const existingStone = await Stone.findOne({
      name,
      number,
      inventoryType,
      _id: { $ne: id },
    });
    if (existingStone) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Stone with this name and number already exists for this inventory type',
        },
        { status: 400 },
      );
    }

    // Update the stone
    const updatedStone = await Stone.findByIdAndUpdate(
      id,
      {
        name,
        number,
        color,
        size,
        unit,
        inventoryType,
        updatedBy: user._id,
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Stone updated successfully',
      data: updatedStone,
    });
  } catch (error) {
    console.error('Update stone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Stone quantity cannot be negative' },
        { status: 400 },
      );
    }

    // Round to 2 decimal places
    const roundedQuantity = Math.round(quantity * 100) / 100;

    // First get the old value
    const existingStone = await Stone.findById(id);
    if (!existingStone) {
      return NextResponse.json(
        { success: false, message: 'Stone not found' },
        { status: 404 },
      );
    }

    const stone = await Stone.findByIdAndUpdate(
      id,
      {
        quantity: roundedQuantity,
        updatedBy: user._id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: existingStone.quantity,
            newValue: roundedQuantity,
            updatedBy: user._id,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Stone quantity updated successfully',
      data: stone,
    });
  } catch (error) {
    console.error('Error updating stone quantity:', error);
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

    const { id } = await params;
    const stone = await Stone.findById(id);
    if (!stone) {
      return NextResponse.json(
        { success: false, message: 'Stone not found' },
        { status: 404 },
      );
    }

    // Reset quantity to 0 instead of deleting
    await Stone.findByIdAndUpdate(
      id,
      {
        quantity: 0,
        updatedBy: user._id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: stone.quantity,
            newValue: 0,
            updatedBy: user._id,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Stone quantity reset to 0 successfully',
    });
  } catch (error) {
    console.error('Reset stone quantity error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

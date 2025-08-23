import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';
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

    const body = await request.json();
    const { name, width } = body;

    if (!name || !width) {
      return NextResponse.json(
        { success: false, message: 'Name and width are required' },
        { status: 400 },
      );
    }

    // Validate numeric fields
    if (typeof width !== 'number' || width <= 0) {
      return NextResponse.json(
        { success: false, message: 'Width must be a positive number' },
        { status: 400 },
      );
    }

    const { id } = await params;
    const plastic = await Plastic.findById(id);
    if (!plastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic not found' },
        { status: 404 },
      );
    }

    // Check if name already exists (excluding current plastic)
    const existingPlastic = await Plastic.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingPlastic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Plastic with this name already exists',
        },
        { status: 400 },
      );
    }

    // Update the plastic
    const updatedPlastic = await Plastic.findByIdAndUpdate(
      id,
      {
        name,
        width,
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Plastic updated successfully',
      data: updatedPlastic,
    });
  } catch (error) {
    console.error('Update plastic error:', error);
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
        { success: false, message: 'Valid quantity is required' },
        { status: 400 },
      );
    }

    const plastic = await Plastic.findByIdAndUpdate(
      id,
      { quantity },
      { new: true },
    );

    if (!plastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plastic quantity updated successfully',
      data: plastic,
    });
  } catch (error) {
    console.error('Error updating plastic quantity:', error);
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
    const plastic = await Plastic.findById(id);
    if (!plastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic not found' },
        { status: 404 },
      );
    }

    // Reset quantity to 0 instead of deleting
    await Plastic.findByIdAndUpdate(
      id,
      {
        quantity: 0,
        updatedBy: user.id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: plastic.quantity,
            newValue: 0,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Plastic quantity reset to 0 successfully',
    });
  } catch (error) {
    console.error('Reset plastic quantity error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

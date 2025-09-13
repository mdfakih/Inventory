import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 },
      );
    }

    const { id } = await params;
    const tape = await Tape.findById(id);
    if (!tape) {
      return NextResponse.json(
        { success: false, message: 'Tape not found' },
        { status: 404 },
      );
    }

    // Check if name already exists (excluding current tape)
    const existingTape = await Tape.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingTape) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tape with this name already exists',
        },
        { status: 400 },
      );
    }

    // Update the tape
    const updatedTape = await Tape.findByIdAndUpdate(
      id,
      {
        name,
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Tape updated successfully',
      data: updatedTape,
    });
  } catch (error) {
    console.error('Update tape error:', error);
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

    const tape = await Tape.findByIdAndUpdate(id, { quantity }, { new: true });

    if (!tape) {
      return NextResponse.json(
        { success: false, message: 'Tape not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tape quantity updated successfully',
      data: tape,
    });
  } catch (error) {
    console.error('Error updating tape quantity:', error);
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
    const tape = await Tape.findById(id);
    if (!tape) {
      return NextResponse.json(
        { success: false, message: 'Tape not found' },
        { status: 404 },
      );
    }

    // Reset quantity to 0 instead of deleting
    await Tape.findByIdAndUpdate(
      id,
      {
        quantity: 0,
        updatedBy: user._id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: tape.quantity,
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
      message: 'Tape quantity reset to 0 successfully',
    });
  } catch (error) {
    console.error('Reset tape quantity error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

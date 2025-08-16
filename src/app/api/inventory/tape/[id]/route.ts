import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      { new: true }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can delete master data' },
        { status: 403 },
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

    // Check if tape has quantity > 0
    if (tape.quantity > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete tape with existing stock' },
        { status: 400 },
      );
    }

    await Tape.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Tape deleted successfully',
    });
  } catch (error) {
    console.error('Delete tape error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

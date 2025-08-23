import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';
import { getCurrentUser } from '@/lib/auth';

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

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only administrators can delete master data',
        },
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

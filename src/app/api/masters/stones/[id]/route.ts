import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Stone from '@/models/Stone';
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
    const stone = await Stone.findById(id);
    if (!stone) {
      return NextResponse.json(
        { success: false, message: 'Stone not found' },
        { status: 404 },
      );
    }

    // Check if stone has quantity > 0
    if (stone.quantity > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete stone with existing stock' },
        { status: 400 },
      );
    }

    await Stone.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Stone deleted successfully',
    });
  } catch (error) {
    console.error('Delete stone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

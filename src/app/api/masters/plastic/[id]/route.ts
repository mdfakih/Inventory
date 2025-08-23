import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';
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
    const plastic = await Plastic.findById(id);
    if (!plastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic not found' },
        { status: 404 },
      );
    }

    // Check if plastic has quantity > 0
    if (plastic.quantity > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete plastic with existing stock',
        },
        { status: 400 },
      );
    }

    await Plastic.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Plastic deleted successfully',
    });
  } catch (error) {
    console.error('Delete plastic error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

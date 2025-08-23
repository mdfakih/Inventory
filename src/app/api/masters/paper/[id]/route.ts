import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Paper from '@/models/Paper';
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
    const paper = await Paper.findById(id);
    if (!paper) {
      return NextResponse.json(
        { success: false, message: 'Paper not found' },
        { status: 404 },
      );
    }

    // Check if paper has quantity > 0
    if (paper.quantity > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete paper with existing stock' },
        { status: 400 },
      );
    }

    await Paper.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Paper deleted successfully',
    });
  } catch (error) {
    console.error('Delete paper error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

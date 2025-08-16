import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';

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

    // First get the old value
    const existingPaper = await Paper.findById(id);
    if (!existingPaper) {
      return NextResponse.json(
        { success: false, message: 'Paper not found' },
        { status: 404 },
      );
    }

    const paper = await Paper.findByIdAndUpdate(
      id,
      {
        quantity,
        updatedBy: user.id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: existingPaper.quantity,
            newValue: quantity,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Paper quantity updated successfully',
      data: paper,
    });
  } catch (error) {
    console.error('Error updating paper quantity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

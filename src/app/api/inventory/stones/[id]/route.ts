import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Stone from '@/models/Stone';
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

    const stone = await Stone.findByIdAndUpdate(
      id,
      {
        quantity,
        updatedBy: user.id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: (await Stone.findById(id))?.quantity,
            newValue: quantity,
            updatedBy: user.id,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!stone) {
      return NextResponse.json(
        { success: false, message: 'Stone not found' },
        { status: 404 },
      );
    }

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

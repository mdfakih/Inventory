import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'internal';

    const papers = await Paper.find({ inventoryType: type }).sort({ width: 1 });

    return NextResponse.json({
      success: true,
      data: papers,
    });
  } catch (error) {
    console.error('Get papers error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      width,
      quantity,
      piecesPerRoll,
      weightPerPiece,
      inventoryType = 'internal',
    } = body;

    if (
      !width ||
      quantity === undefined ||
      !piecesPerRoll ||
      weightPerPiece === undefined
    ) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    // Check if paper width already exists for the same inventory type
    const existingPaper = await Paper.findOne({ width, inventoryType });
    if (existingPaper) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paper width already exists for this inventory type',
        },
        { status: 400 },
      );
    }

    const paper = new Paper({
      width,
      quantity,
      piecesPerRoll,
      weightPerPiece,
      inventoryType,
      updatedBy: user.id,
    });

    await paper.save();

    return NextResponse.json({
      success: true,
      message: 'Paper created successfully',
      data: paper,
    });
  } catch (error) {
    console.error('Create paper error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

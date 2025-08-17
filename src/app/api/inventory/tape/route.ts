import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();

    const tapes = await Tape.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: tapes,
    });
  } catch (error) {
    console.error('Get tapes error:', error);
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
    const { name = 'Cello Tape', quantity = 0 } = body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Quantity must be a non-negative number' },
        { status: 400 },
      );
    }

    // Check if tape name already exists
    const existingTape = await Tape.findOne({ name });
    if (existingTape) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tape with this name already exists',
        },
        { status: 400 },
      );
    }

    const tape = new Tape({
      name,
      quantity,
    });

    await tape.save();

    return NextResponse.json({
      success: true,
      message: 'Tape created successfully',
      data: tape,
    });
  } catch (error) {
    console.error('Create tape error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

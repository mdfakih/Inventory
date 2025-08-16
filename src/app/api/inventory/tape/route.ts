import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';

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

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'Quantity is required' },
        { status: 400 }
      );
    }

    const tape = new Tape({
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
      { status: 500 }
    );
  }
}

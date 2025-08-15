import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Stone from '@/models/Stone';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const stones = await Stone.find().sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: stones,
    });
  } catch (error) {
    console.error('Get stones error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, number, color, size, quantity, unit } = body;

    if (!name || !number || !color || !size || quantity === undefined || !unit) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if stone number already exists
    const existingStone = await Stone.findOne({ number });
    if (existingStone) {
      return NextResponse.json(
        { success: false, message: 'Stone number already exists' },
        { status: 400 }
      );
    }

    const stone = new Stone({
      name,
      number,
      color,
      size,
      quantity,
      unit,
    });

    await stone.save();

    return NextResponse.json({
      success: true,
      message: 'Stone created successfully',
      data: stone,
    });
  } catch (error) {
    console.error('Create stone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

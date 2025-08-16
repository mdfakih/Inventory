import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Stone from '@/models/Stone';

export async function GET(request: NextRequest) {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'internal';

    const stones = await Stone.find({ inventoryType: type }).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: stones,
    });
  } catch (error) {
    console.error('Get stones error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { success: false, message: 'Database connection failed. Please check if MongoDB is running.' },
          { status: 500 },
        );
      }
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          { success: false, message: 'Database configuration error. Please check environment variables.' },
          { status: 500 },
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 },
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      name,
      number,
      color,
      size,
      quantity,
      unit,
      inventoryType = 'internal',
    } = body;

    if (
      !name ||
      !number ||
      !color ||
      !size ||
      quantity === undefined ||
      !unit
    ) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      );
    }

    // Check if stone number already exists for the same inventory type
    const existingStone = await Stone.findOne({ number, inventoryType });
    if (existingStone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Stone number already exists for this inventory type',
        },
        { status: 400 },
      );
    }

    const stone = new Stone({
      name,
      number,
      color,
      size,
      quantity,
      unit,
      inventoryType,
    });

    await stone.save();

    return NextResponse.json({
      success: true,
      message: 'Stone created successfully',
      data: stone,
    });
  } catch (error) {
    console.error('Create stone error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { success: false, message: 'Database connection failed. Please check if MongoDB is running.' },
          { status: 500 },
        );
      }
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          { success: false, message: 'Database configuration error. Please check environment variables.' },
          { status: 500 },
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();

    const plastics = await Plastic.find().sort({ width: 1 });

    return NextResponse.json({
      success: true,
      data: plastics,
    });
  } catch (error) {
    console.error('Get plastics error:', error);
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
    const { name, width, quantity = 0 } = body;

    if (!name || !width) {
      return NextResponse.json(
        { success: false, message: 'Name and width are required' },
        { status: 400 },
      );
    }

    // Validate numeric fields
    if (typeof width !== 'number' || width <= 0) {
      return NextResponse.json(
        { success: false, message: 'Width must be a positive number' },
        { status: 400 },
      );
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Quantity must be a non-negative number' },
        { status: 400 },
      );
    }

    // Check if plastic name already exists
    const existingPlastic = await Plastic.findOne({ name });
    if (existingPlastic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Plastic with this name already exists',
        },
        { status: 400 },
      );
    }

    const plastic = new Plastic({
      name,
      width,
      quantity,
    });

    await plastic.save();

    return NextResponse.json({
      success: true,
      message: 'Plastic created successfully',
      data: plastic,
    });
  } catch (error) {
    console.error('Create plastic error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

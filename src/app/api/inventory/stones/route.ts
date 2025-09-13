import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Stone from '@/models/Stone';
import { getCurrentUser } from '@/lib/auth';

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

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'internal';
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate inventory type
    if (!['internal', 'out'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
    }

    // If all=true, return all stones without pagination
    if (all) {
      console.log(`Fetching all stones for type: ${type}`);
      const stones = await Stone.find({ inventoryType: type }).sort({
        name: 1,
      });
      console.log(`Found ${stones.length} stones`);

      return NextResponse.json({
        success: true,
        data: stones,
      });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const skip = (page - 1) * limit;

    // Get total count
    const total = await Stone.countDocuments({ inventoryType: type });

    // Get stones with pagination
    const stones = await Stone.find({ inventoryType: type })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: stones,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get stones error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
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

    // Only admin can create master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only administrators can create master data',
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      number,
      color,
      size,
      unit,
      quantity = 0,
      inventoryType = 'internal',
    } = body;

    // Validate required fields
    if (!name || !number || !color || !size || !unit) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, number, color, size, and unit are required',
        },
        { status: 400 },
      );
    }

    // Validate unit
    if (!['g', 'kg'].includes(unit)) {
      return NextResponse.json(
        { success: false, message: 'Unit must be either "g" or "kg"' },
        { status: 400 },
      );
    }

    // Validate inventory type
    if (!['internal', 'out'].includes(inventoryType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
    }

    // Validate stone quantity
    if (quantity < 0.1) {
      return NextResponse.json(
        { success: false, message: 'Stone quantity must be at least 0.1g' },
        { status: 400 },
      );
    }

    // Round quantity to 2 decimal places
    const roundedQuantity = Math.round(quantity * 100) / 100;

    // Check if stone with same name and number already exists
    const existingStone = await Stone.findOne({
      name,
      number,
      inventoryType,
    });

    if (existingStone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Stone with this name and number already exists',
        },
        { status: 400 },
      );
    }

    // Create new stone
    const stone = new Stone({
      name,
      number,
      color,
      size,
      unit,
      quantity: roundedQuantity,
      inventoryType,
      weightPerPiece: 0, // Default value since it's not collected in the form
      createdBy: user._id,
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
      { status: 500 },
    );
  }
}

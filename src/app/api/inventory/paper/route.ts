import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Paper from '@/models/Paper';
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

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'internal';

    // Validate inventory type
    if (!['internal', 'out'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
    }

    const papers = await Paper.find({ inventoryType: type }).sort({ width: 1 });

    return NextResponse.json({
      success: true,
      data: papers,
    });
  } catch (error) {
    console.error('Get papers error:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database connection failed. Please check if MongoDB is running.',
          },
          { status: 500 },
        );
      }
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database configuration error. Please check environment variables.',
          },
          { status: 500 },
        );
      }
      if (error.message.includes('MongoNetworkError')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Database network error. Please check your connection.',
          },
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

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      name,
      width,
      quantity,
      piecesPerRoll,
      weightPerPiece,
      inventoryType = 'internal',
    } = body;

    if (
      !name ||
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

    // Validate inventory type
    if (!['internal', 'out'].includes(inventoryType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
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

    if (typeof piecesPerRoll !== 'number' || piecesPerRoll <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pieces per roll must be a positive number',
        },
        { status: 400 },
      );
    }

    if (typeof weightPerPiece !== 'number' || weightPerPiece <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Weight per piece must be a positive number',
        },
        { status: 400 },
      );
    }

    // Check if paper name already exists for the same inventory type
    const existingPaper = await Paper.findOne({ name, inventoryType });
    if (existingPaper) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paper with this name already exists for this inventory type',
        },
        { status: 400 },
      );
    }

    const paper = new Paper({
      name,
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

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database connection failed. Please check if MongoDB is running.',
          },
          { status: 500 },
        );
      }
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Database configuration error. Please check environment variables.',
          },
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

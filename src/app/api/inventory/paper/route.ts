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

    // If all=true, return all papers without pagination
    if (all) {
      console.log(`Fetching all papers for type: ${type}`);
      const papers = await Paper.find({ inventoryType: type }).sort({
        width: 1,
      });
      console.log(`Found ${papers.length} papers`);

      return NextResponse.json({
        success: true,
        data: papers,
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
    const total = await Paper.countDocuments({ inventoryType: type });

    // Get papers with pagination
    const papers = await Paper.find({ inventoryType: type })
      .sort({ width: 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: papers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get papers error:', error);
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

    // Parse request body
    const body = await request.json();
    const {
      name,
      width,
      quantity,
      piecesPerRoll,
      weightPerPiece,
      inventoryType,
    } = body;

    // Validate required fields
    if (!name || !width || !piecesPerRoll || !weightPerPiece) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate field types and values
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Name must be a non-empty string' },
        { status: 400 },
      );
    }

    if (typeof width !== 'number' || width <= 0) {
      return NextResponse.json(
        { success: false, message: 'Width must be a positive number' },
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

    if (typeof weightPerPiece !== 'number' || weightPerPiece < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Weight per piece must be a non-negative number',
        },
        { status: 400 },
      );
    }

    if (inventoryType && !['internal', 'out'].includes(inventoryType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
    }

    // Calculate total pieces based on quantity and pieces per roll
    const totalPieces = (quantity || 0) * piecesPerRoll;

    // Create new paper
    const paper = new Paper({
      name: name.trim(),
      width: Number(width),
      quantity: Number(quantity) || 0,
      totalPieces,
      piecesPerRoll: Number(piecesPerRoll),
      weightPerPiece: Number(weightPerPiece),
      inventoryType: inventoryType || 'internal',
      updatedBy: user._id,
    });

    await paper.save();

    return NextResponse.json({
      success: true,
      message: 'Paper type created successfully',
      data: paper,
    });
  } catch (error: unknown) {
    console.error('Create paper error:', error);

    // Handle duplicate key error
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A paper type with this name already exists for this inventory type',
        },
        { status: 400 },
      );
    }

    // Handle validation errors
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ValidationError' &&
      'errors' in error
    ) {
      const messages = Object.values(
        error.errors as Record<string, { message: string }>,
      ).map((err) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

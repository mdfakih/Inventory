import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // If all=true, return all plastics without pagination
    if (all) {
      const plastics = await Plastic.find().sort({ width: 1 });

      return NextResponse.json({
        success: true,
        data: plastics,
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
    const total = await Plastic.countDocuments();

    // Get plastics with pagination
    const plastics = await Plastic.find()
      .sort({ width: 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: plastics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
    const { name, width, quantity } = body;

    // Validate required fields
    if (!name || !width) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: name and width are required',
        },
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

    if (
      quantity !== undefined &&
      (typeof quantity !== 'number' || quantity < 0)
    ) {
      return NextResponse.json(
        { success: false, message: 'Quantity must be a non-negative number' },
        { status: 400 },
      );
    }

    // Create new plastic
    const plastic = new Plastic({
      name: name.trim(),
      width: Number(width),
      quantity: Number(quantity) || 0,
    });

    await plastic.save();

    return NextResponse.json({
      success: true,
      message: 'Plastic type created successfully',
      data: plastic,
    });
  } catch (error: unknown) {
    console.error('Create plastic error:', error);

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
          message: 'A plastic type with this name already exists',
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

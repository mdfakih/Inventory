import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Paper from '@/models/Paper';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate inventory type
    if (!['internal', 'out'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
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
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

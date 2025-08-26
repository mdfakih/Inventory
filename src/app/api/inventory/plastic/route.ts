import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

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

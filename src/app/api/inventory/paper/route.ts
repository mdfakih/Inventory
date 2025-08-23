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

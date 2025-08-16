import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';

export async function GET() {
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
    const tapes = await Tape.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: tapes,
    });
  } catch (error) {
    console.error('Get tapes error:', error);

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

    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'Quantity is required' },
        { status: 400 },
      );
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Quantity must be a non-negative number' },
        { status: 400 },
      );
    }

    const tape = new Tape({
      quantity,
    });

    await tape.save();

    return NextResponse.json({
      success: true,
      message: 'Tape created successfully',
      data: tape,
    });
  } catch (error) {
    console.error('Create tape error:', error);

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

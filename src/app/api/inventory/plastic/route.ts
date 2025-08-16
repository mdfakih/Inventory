import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';

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
    const plastics = await Plastic.find().sort({ width: 1 });

    return NextResponse.json({
      success: true,
      data: plastics,
    });
  } catch (error) {
    console.error('Get plastics error:', error);

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
    const { width, quantity } = body;

    if (!width || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
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

    // Check if plastic width already exists
    const existingPlastic = await Plastic.findOne({ width });
    if (existingPlastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic width already exists' },
        { status: 400 },
      );
    }

    const plastic = new Plastic({
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

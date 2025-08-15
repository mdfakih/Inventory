import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';

export async function GET(request: NextRequest) {
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
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { width, quantity } = body;

    if (!width || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if plastic width already exists
    const existingPlastic = await Plastic.findOne({ width });
    if (existingPlastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic width already exists' },
        { status: 400 }
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
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

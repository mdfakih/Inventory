import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';

export async function GET() {
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
      { status: 500 },
    );
  }
}

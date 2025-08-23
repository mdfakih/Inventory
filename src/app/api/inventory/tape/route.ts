import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';

export async function GET() {
  try {
    await dbConnect();

    const tapes = await Tape.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: tapes,
    });
  } catch (error) {
    console.error('Get tapes error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

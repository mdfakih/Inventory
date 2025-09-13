import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Tape from '@/models/Tape';
import { getCurrentUser } from '@/lib/auth';

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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admin can delete tape types' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json(
        { success: false, message: 'No tape ids provided' },
        { status: 400 },
      );
    }

    const result = await Tape.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      message: 'Tape types deleted successfully',
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (error) {
    console.error('Bulk delete tapes error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

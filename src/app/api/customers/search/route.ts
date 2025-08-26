import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    // Search by name, phone, or email
    const customers = await Customer.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    })
      .select('_id name phone email company customerType')
      .limit(limit)
      .sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to search customers' },
      { status: 500 }
    );
  }
}

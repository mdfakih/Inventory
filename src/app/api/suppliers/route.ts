import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import Supplier from '@/models/Supplier';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'active';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .select('-__v');

    return NextResponse.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

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

    const body = await request.json();
    const { name, contactPerson, phone, email, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Supplier name is required' },
        { status: 400 },
      );
    }

    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({ name: name.trim() });
    if (existingSupplier) {
      return NextResponse.json(
        { success: false, message: 'Supplier with this name already exists' },
        { status: 400 },
      );
    }

    const supplier = new Supplier({
      name: name.trim(),
      contactPerson: contactPerson?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      address: address?.trim(),
    });

    await supplier.save();

    return NextResponse.json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

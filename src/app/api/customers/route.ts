import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const customerType = searchParams.get('customerType');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Build query
    const query: {
      $text?: { $search: string };
      customerType?: string;
      isActive?: boolean;
    } = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (customerType) {
      query.customerType = customerType;
    }

    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    // Get total count
    const total = await Customer.countDocuments(query);

    // Get customers with pagination
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user?._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone: body.phone });
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer with this phone number already exists',
        },
        { status: 400 },
      );
    }

    const customer = new Customer({
      ...body,
      createdBy: user._id,
    });

    await customer.save();

    const populatedCustomer = await Customer.findById(customer._id).populate(
      'createdBy',
      'name',
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Customer created successfully',
        data: populatedCustomer,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create customer' },
      { status: 500 },
    );
  }
}

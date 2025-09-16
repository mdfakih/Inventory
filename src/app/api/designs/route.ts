import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Design from '@/models/Design';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const all = searchParams.get('all') === 'true';

    // If all=true, return all designs without pagination (for dropdowns)
    if (all) {
      const designs = await Design.find()
        .populate('defaultStones.stoneId')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ name: 1 })
        .lean();

      return NextResponse.json(
        { success: true, data: designs },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const skip = (page - 1) * limit;

    // Get total count
    const total = await Design.countDocuments();

    // Get designs with pagination
    const designs = await Design.find()
      .populate('defaultStones.stoneId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: designs,
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
    console.error('Get designs error:', error);
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
    const { name, number, imageUrl, prices, defaultStones } = body;

    if (!name || !number) {
      return NextResponse.json(
        { success: false, message: 'Name and number are required' },
        { status: 400 },
      );
    }

    // Validate that at least one stone is provided
    if (
      !defaultStones ||
      !Array.isArray(defaultStones) ||
      defaultStones.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one stone must be selected for the design',
        },
        { status: 400 },
      );
    }

    // Validate that all stones have valid stoneId and quantity
    const validStones = defaultStones.filter(
      (stone) => stone.stoneId && stone.stoneId.trim() !== '',
    );
    if (validStones.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one stone must be selected for the design',
        },
        { status: 400 },
      );
    }

    // Validate stone quantities
    for (const stone of validStones) {
      if (stone.quantity < 0.1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Stone quantity must be at least 0.1g',
          },
          { status: 400 },
        );
      }
      // Round to 2 decimal places
      stone.quantity = Math.round(stone.quantity * 100) / 100;
    }

    // Check if design number already exists
    const existingDesign = await Design.findOne({ number });
    if (existingDesign) {
      return NextResponse.json(
        { success: false, message: 'Design number already exists' },
        { status: 400 },
      );
    }

    const design = new Design({
      name,
      number,
      imageUrl: imageUrl || '',
      prices: prices || [],
      defaultStones: defaultStones || [],
      createdBy: user._id,
    });

    await design.save();

    return NextResponse.json({
      success: true,
      message: 'Design created successfully',
      data: design,
    });
  } catch (error) {
    console.error('Create design error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

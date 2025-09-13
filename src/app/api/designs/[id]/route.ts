import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Design from '@/models/Design';
import { getCurrentUser } from '@/lib/auth';

interface DesignUpdateData {
  name: string;
  number: string;
  imageUrl: string;
  prices: Array<{ currency: string; price: number }>;
  defaultStones: Array<{ stoneId: string; quantity: number }>;
  updatedBy: string;
  updateHistory: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
    updatedBy: string;
    updatedAt: Date;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const design = await Design.findById(id)
      .populate('defaultStones.stoneId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!design) {
      return NextResponse.json(
        { success: false, message: 'Design not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: design,
    });
  } catch (error) {
    console.error('Get design error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { id } = await params;
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

    // Check if design number already exists for other designs
    const existingDesign = await Design.findOne({ number, _id: { $ne: id } });
    if (existingDesign) {
      return NextResponse.json(
        { success: false, message: 'Design number already exists' },
        { status: 400 },
      );
    }

    const design = await Design.findById(id);
    if (!design) {
      return NextResponse.json(
        { success: false, message: 'Design not found' },
        { status: 404 },
      );
    }

    // Track changes for update history
    const updateHistory = [];
    const oldValues = {
      name: design.name,
      number: design.number,
      imageUrl: design.imageUrl,
      prices: design.prices,
      defaultStones: design.defaultStones,
    };

    if (name !== oldValues.name) {
      updateHistory.push({
        field: 'name',
        oldValue: oldValues.name,
        newValue: name,
        updatedBy: user._id,
        updatedAt: new Date(),
      });
    }

    if (number !== oldValues.number) {
      updateHistory.push({
        field: 'number',
        oldValue: oldValues.number,
        newValue: number,
        updatedBy: user._id,
        updatedAt: new Date(),
      });
    }

    if (imageUrl !== oldValues.imageUrl) {
      updateHistory.push({
        field: 'imageUrl',
        oldValue: oldValues.imageUrl,
        newValue: imageUrl,
        updatedBy: user._id,
        updatedAt: new Date(),
      });
    }

    if (JSON.stringify(prices) !== JSON.stringify(oldValues.prices)) {
      updateHistory.push({
        field: 'prices',
        oldValue: oldValues.prices,
        newValue: prices,
        updatedBy: user._id,
        updatedAt: new Date(),
      });
    }

    if (
      JSON.stringify(defaultStones) !== JSON.stringify(oldValues.defaultStones)
    ) {
      updateHistory.push({
        field: 'defaultStones',
        oldValue: oldValues.defaultStones,
        newValue: defaultStones,
        updatedBy: user._id,
        updatedAt: new Date(),
      });
    }

    // Update design
    const updateData: DesignUpdateData = {
      name,
      number,
      imageUrl: imageUrl || '',
      prices: prices || [],
      defaultStones: defaultStones || [],
      updatedBy: user._id,
      updateHistory: [...(design.updateHistory || []), ...updateHistory],
    };

    const updatedDesign = await Design.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('defaultStones.stoneId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Design updated successfully',
      data: updatedDesign,
    });
  } catch (error) {
    console.error('Update design error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Only admin can delete designs
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admin can delete designs' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const design = await Design.findByIdAndDelete(id);
    if (!design) {
      return NextResponse.json(
        { success: false, message: 'Design not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Design deleted successfully',
    });
  } catch (error) {
    console.error('Delete design error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

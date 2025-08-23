import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Design from '@/models/Design';
import Stone from '@/models/Stone';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

interface DesignUpdateData {
  name: string;
  number: string;
  imageUrl: string;
  prices: Array<{ currency: string; price: number }>;
  defaultStones: Array<{ stoneId: string; quantity: number }>;
  paperConfigurations: Array<{
    paperSize: number;
    defaultStones: Array<{ stoneId: string; quantity: number }>;
  }>;
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
      .populate('paperConfigurations.defaultStones.stoneId')
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
    const {
      name,
      number,
      imageUrl,
      prices,
      defaultStones,
      paperConfigurations,
    } = body;

    if (!name || !number || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Name, number, and image URL are required' },
        { status: 400 },
      );
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
      paperConfigurations: design.paperConfigurations,
    };

    if (name !== oldValues.name) {
      updateHistory.push({
        field: 'name',
        oldValue: oldValues.name,
        newValue: name,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (number !== oldValues.number) {
      updateHistory.push({
        field: 'number',
        oldValue: oldValues.number,
        newValue: number,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (imageUrl !== oldValues.imageUrl) {
      updateHistory.push({
        field: 'imageUrl',
        oldValue: oldValues.imageUrl,
        newValue: imageUrl,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (JSON.stringify(prices) !== JSON.stringify(oldValues.prices)) {
      updateHistory.push({
        field: 'prices',
        oldValue: oldValues.prices,
        newValue: prices,
        updatedBy: user.id,
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
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    if (
      JSON.stringify(paperConfigurations) !==
      JSON.stringify(oldValues.paperConfigurations)
    ) {
      updateHistory.push({
        field: 'paperConfigurations',
        oldValue: oldValues.paperConfigurations,
        newValue: paperConfigurations,
        updatedBy: user.id,
        updatedAt: new Date(),
      });
    }

    // Update design
    const updateData: DesignUpdateData = {
      name,
      number,
      imageUrl,
      prices: prices || [],
      defaultStones: defaultStones || [],
      paperConfigurations: paperConfigurations || [],
      updatedBy: user.id,
      updateHistory: [...(design.updateHistory || []), ...updateHistory],
    };

    const updatedDesign = await Design.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('defaultStones.stoneId')
      .populate('paperConfigurations.defaultStones.stoneId')
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

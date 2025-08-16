import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Design from '@/models/Design';
import { getCurrentUser } from '@/lib/auth';

interface DesignUpdateData {
  name: string;
  number: string;
  imageUrl: string;
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

    const body = await request.json();
    const { name, number, imageUrl, defaultStones, paperConfigurations } = body;
    const { id } = await params;

    const design = await Design.findById(id);
    if (!design) {
      return NextResponse.json(
        { success: false, message: 'Design not found' },
        { status: 404 },
      );
    }

    // Track changes for audit trail
    const updateHistory = [];
    const oldValues = design.toObject();

    // Check for changes and add to history
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

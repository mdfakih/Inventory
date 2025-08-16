import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Plastic from '@/models/Plastic';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can edit master data' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, width } = body;

    if (!name || !width) {
      return NextResponse.json(
        { success: false, message: 'Name and width are required' },
        { status: 400 },
      );
    }

    // Validate numeric fields
    if (typeof width !== 'number' || width <= 0) {
      return NextResponse.json(
        { success: false, message: 'Width must be a positive number' },
        { status: 400 },
      );
    }

    const plastic = await Plastic.findById(params.id);
    if (!plastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic not found' },
        { status: 404 },
      );
    }

    // Check if name already exists (excluding current plastic)
    const existingPlastic = await Plastic.findOne({
      name,
      _id: { $ne: params.id },
    });
    if (existingPlastic) {
      return NextResponse.json(
        {
          success: false,
          message: 'Plastic with this name already exists',
        },
        { status: 400 },
      );
    }

    // Update the plastic
    const updatedPlastic = await Plastic.findByIdAndUpdate(
      params.id,
      {
        name,
        width,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Plastic updated successfully',
      data: updatedPlastic,
    });
  } catch (error) {
    console.error('Update plastic error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can delete master data' },
        { status: 403 },
      );
    }

    const plastic = await Plastic.findById(params.id);
    if (!plastic) {
      return NextResponse.json(
        { success: false, message: 'Plastic not found' },
        { status: 404 },
      );
    }

    // Check if plastic has quantity > 0
    if (plastic.quantity > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete plastic with existing stock' },
        { status: 400 },
      );
    }

    await Plastic.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Plastic deleted successfully',
    });
  } catch (error) {
    console.error('Delete plastic error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

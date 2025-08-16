import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Paper from '@/models/Paper';
import { getCurrentUser } from '@/lib/auth';

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

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can edit master data' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, width, piecesPerRoll, weightPerPiece } = body;

    if (!name || !width || !piecesPerRoll || weightPerPiece === undefined) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
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

    if (typeof piecesPerRoll !== 'number' || piecesPerRoll <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pieces per roll must be a positive number',
        },
        { status: 400 },
      );
    }

    if (typeof weightPerPiece !== 'number' || weightPerPiece <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Weight per piece must be a positive number',
        },
        { status: 400 },
      );
    }

    const { id } = await params;
    const paper = await Paper.findById(id);
    if (!paper) {
      return NextResponse.json(
        { success: false, message: 'Paper not found' },
        { status: 404 },
      );
    }

    // Check if name already exists for the same inventory type (excluding current paper)
    const existingPaper = await Paper.findOne({
      name,
      inventoryType: paper.inventoryType,
      _id: { $ne: id },
    });
    if (existingPaper) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Paper with this name already exists for this inventory type',
        },
        { status: 400 },
      );
    }

    // Update the paper
    const updatedPaper = await Paper.findByIdAndUpdate(
      id,
      {
        name,
        width,
        piecesPerRoll,
        weightPerPiece,
        updatedBy: user.id,
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Paper updated successfully',
      data: updatedPaper,
    });
  } catch (error) {
    console.error('Update paper error:', error);
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

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only administrators can delete master data',
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const paper = await Paper.findById(id);
    if (!paper) {
      return NextResponse.json(
        { success: false, message: 'Paper not found' },
        { status: 404 },
      );
    }

    // Check if paper has quantity > 0
    if (paper.quantity > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete paper with existing stock' },
        { status: 400 },
      );
    }

    await Paper.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Paper deleted successfully',
    });
  } catch (error) {
    console.error('Delete paper error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

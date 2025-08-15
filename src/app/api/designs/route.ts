import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Design from '@/models/Design';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const designs = await Design.find()
      .populate('defaultStones.stoneId')
      .populate('paperConfigurations.defaultStones.stoneId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: designs,
    });
  } catch (error) {
    console.error('Get designs error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
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
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, number, imageUrl, defaultStones, paperConfigurations } = body;

    if (!name || !number || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Name, number, and image URL are required' },
        { status: 400 }
      );
    }

    // Check if design number already exists
    const existingDesign = await Design.findOne({ number });
    if (existingDesign) {
      return NextResponse.json(
        { success: false, message: 'Design number already exists' },
        { status: 400 }
      );
    }

    const design = new Design({
      name,
      number,
      imageUrl,
      defaultStones: defaultStones || [],
      paperConfigurations: paperConfigurations || [],
      createdBy: user.id,
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
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await User.findById(params.id).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { action, newPassword } = await request.json();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    if (action === 'toggle-status') {
      user.status = user.status === 'active' ? 'blocked' : 'active';
      await user.save();

      return NextResponse.json({
        success: true,
        message: `User ${user.status === 'active' ? 'activated' : 'blocked'} successfully`,
        data: { status: user.status },
      });
    } else if (action === 'change-password') {
      if (!newPassword) {
        return NextResponse.json(
          { success: false, message: 'New password is required' },
          { status: 400 },
        );
      }

      user.password = newPassword;
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 },
    );
  }
}

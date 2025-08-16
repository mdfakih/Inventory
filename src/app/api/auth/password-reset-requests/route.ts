import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { generateRandomPassword } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();

    // Get users with pending password reset requests
    const users = await User.find({
      'passwordResetRequest.requested': true,
      'passwordResetRequest.approved': false,
    }).select('name email passwordResetRequest createdAt');

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { userId, action } = await request.json();
    const adminId = request.headers.get('x-user-id');

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: 'User ID and action are required' },
        { status: 400 },
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    if (action === 'approve') {
      // Generate new password
      const newPassword = generateRandomPassword();
      user.password = newPassword;
      user.passwordResetRequest = {
        requested: false,
        requestedAt: null,
        approved: true,
        approvedAt: new Date(),
        approvedBy: adminId,
      };

      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Password reset approved',
        newPassword,
      });
    } else if (action === 'reject') {
      // Reset the password reset request
      user.passwordResetRequest = {
        requested: false,
        requestedAt: null,
        approved: false,
        approvedAt: null,
        approvedBy: null,
      };

      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Password reset request rejected',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Error processing password reset request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 },
    );
  }
}

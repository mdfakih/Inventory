import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 },
      );
    }

    await dbConnect();

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found with this email' },
        { status: 404 },
      );
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your account has been blocked. Please contact administrator.',
        },
        { status: 403 },
      );
    }

    // Update password reset request
    user.passwordResetRequest = {
      requested: true,
      requestedAt: new Date(),
      approved: false,
      approvedAt: null,
      approvedBy: null,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password reset request submitted successfully',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 },
    );
  }
}

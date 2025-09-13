import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // First try to get user info from middleware headers (preferred method)
    let userId = request.headers.get('x-user-id');
    let userEmail = request.headers.get('x-user-email');
    let userRole = request.headers.get('x-user-role');

    console.log('Auth headers:', { userId, userEmail, userRole });

    // If headers are missing, try to get user info from token directly
    if (!userId || !userEmail || !userRole) {
      console.log('Missing auth headers, trying token verification');
      const token = getTokenFromRequest(request);

      if (!token) {
        console.log('No token found');
        return NextResponse.json(
          { success: false, message: 'Not authenticated' },
          { status: 401 },
        );
      }

      const payload = verifyToken(token);
      if (!payload) {
        console.log('Token verification failed');
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 },
        );
      }

      userId = payload.userId;
      userEmail = payload.email;
      userRole = payload.role;
    }

    await dbConnect();

    const userData = await User.findById(userId).select('-password');
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData._id,
        email: userData.email,
        role: userData.role,
        name: userData.name,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

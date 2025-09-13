import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using JWT token
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication token provided' },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 },
      );
    }

    // Check if user has required role
    if (!['admin', 'manager'].includes(payload.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 },
      );
    }

    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout')), 30000); // 30 second timeout
    });

    const uploadPromise = async () => {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file size (min 1 byte)
      if (file.size === 0) {
        throw new Error('File cannot be empty');
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      return {
        success: true,
        data: {
          url: dataUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
        },
      };
    };

    const result = await Promise.race([uploadPromise(), timeoutPromise]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Upload timeout') {
        return NextResponse.json(
          {
            success: false,
            message: 'Upload timed out. Please try again with a smaller file.',
          },
          { status: 408 },
        );
      }

      if (error.message.includes('No file provided')) {
        return NextResponse.json(
          { success: false, message: 'No file provided' },
          { status: 400 },
        );
      }

      if (error.message.includes('Only image files are allowed')) {
        return NextResponse.json(
          { success: false, message: 'Only image files are allowed' },
          { status: 400 },
        );
      }

      if (error.message.includes('File size must be less than 5MB')) {
        return NextResponse.json(
          { success: false, message: 'File size must be less than 5MB' },
          { status: 400 },
        );
      }

      if (error.message.includes('File cannot be empty')) {
        return NextResponse.json(
          { success: false, message: 'File cannot be empty' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}

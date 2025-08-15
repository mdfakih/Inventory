import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete('auth-token');
  return response;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}

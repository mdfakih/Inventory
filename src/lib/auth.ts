import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';
import dbConnect from './db';
import User from '@/models/User';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateRandomPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function getAuthUser(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  return verifyToken(token);
}

export async function getCurrentUser(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return null;

    await dbConnect();
    const user = await User.findById(authUser.id).select('-password');
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function requireAuth(request: NextRequest): JWTPayload {
  const user = getAuthUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function requireRole(
  request: NextRequest,
  allowedRoles: string[],
): JWTPayload {
  const user = requireAuth(request);
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

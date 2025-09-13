import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

type Role = 'admin' | 'manager' | 'employee';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  plainText: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function generateRandomPassword(length = 12): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specials = '!@#$%^&*()_+[]{}|;:,.<>?';
  const all = upper + lower + digits + specials;

  const pick = (chars: string) =>
    chars[Math.floor(Math.random() * chars.length)];

  // Ensure at least one of each category
  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(specials);
  for (let i = pwd.length; i < length; i += 1) {
    pwd += pick(all);
  }
  return pwd
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export function getCurrentUser(
  request: NextRequest,
): { _id: string; email: string; role: Role } | null {
  // Prefer verifying the JWT from the auth cookie
  const token = getTokenFromRequest(request);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return { _id: payload.userId, email: payload.email, role: payload.role };
    }
  }

  // Fallback to headers (legacy)
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role') as Role | null;
  if (userId && email && role) {
    return { _id: userId, email, role };
  }

  return null;
}

export function requireRole(
  request: NextRequest,
  allowed: Role | Role[],
): void {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  const role = request.headers.get('x-user-role') as Role | null;
  if (!role) {
    const err = new Error('Unauthorized') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!roles.includes(role)) {
    const err = new Error('Forbidden') as Error & { status: number };
    err.status = 403;
    throw err;
  }
}

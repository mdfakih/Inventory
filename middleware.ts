import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/unauthorized',
    '/test-unauthorized',
    '/api/auth/login',
    '/api/auth/forgot-password',
  ];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect to login if no token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    // Clear invalid cookie
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // Role-based access control
  const { role } = payload;

  // API routes protection
  if (pathname.startsWith('/api/')) {
    // Admin routes
    if (pathname.startsWith('/api/masters') && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Manager and Admin routes
    if (
      pathname.startsWith('/api/inventory') ||
      pathname.startsWith('/api/designs') ||
      pathname.startsWith('/api/orders')
    ) {
      if (role === 'employee') {
        // Employees can only read
        if (request.method !== 'GET') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }
  }

  // Page routes protection
  if (pathname.startsWith('/dashboard')) {
    // All authenticated users can access dashboard
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/designs') ||
    pathname.startsWith('/orders')
  ) {
    // All authenticated users can access these pages
    return NextResponse.next();
  }

  if (pathname.startsWith('/masters')) {
    // Only admins can access masters page
    if (role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add user info to headers for use in API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

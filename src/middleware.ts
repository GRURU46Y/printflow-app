import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require a valid login session
const PROTECTED_ROUTES = ['/dashboard'];

// API routes that require authentication
const PROTECTED_API_ROUTES = ['/api/jobs', '/api/upload'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected page or API route
  const isProtectedPage = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isProtectedApi = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next(); // Not a protected route, let it through
  }

  const token = request.cookies.get('auth_token')?.value;

  // No token at all
  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Remember where they were going
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token is valid and not expired
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-for-dev-only'
    );
    await jwtVerify(token, secret);
    return NextResponse.next(); // Valid token, allow through
  } catch {
    // Token is expired or tampered with
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    // Clear the bad cookie and redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('expired', 'true');
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth_token');
    return response;
  }
}

// Tell Next.js which paths this middleware should run on
// This avoids running it on _next/static, favicon.ico, images, etc.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/jobs/:path*',
    '/api/upload/:path*',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Guard protected dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // Redirect to login if no token is found
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Prevent logged in users from visiting login page
  if (pathname === '/login') {
    if (token) {
      // Redirect to dashboard if token exists
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};

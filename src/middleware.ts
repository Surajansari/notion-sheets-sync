import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Only protect routes starting with /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = req.headers.get('authorization');

    if (authHeader) {
      const authValue = authHeader.split(' ')[1];
      // Decode base64 user:pass
      const [user, pwd] = atob(authValue).split(':');

      const validUser = process.env.ADMIN_USER || 'admin';
      const validPass = process.env.ADMIN_PASS || 'SyncFlowSecure2026!';

      if (user === validUser && pwd === validPass) {
        return NextResponse.next();
      }
    }

    // Prompt browser for credentials
    return new NextResponse('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Admin Area"',
      },
    });
  }

  return NextResponse.next();
}

// Configure which paths middleware runs on
export const config = {
  matcher: '/admin/:path*',
};
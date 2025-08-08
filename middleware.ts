import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/', // landing if exists
  '/about',
  '/login',
  '/first-login',
  '/simple-login', // if exposed
  '/forms',
  '/document-signing',
  '/secure-signature-portal',
  '/sign-agreement',
  '/test-email',
  '/test-signature',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // allow next static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/api/health') // health endpoint public
  ) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a public path
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedPaths = [
    '/cases',
    '/fleet',
    '/contacts',
    '/financials',
    '/interactions',
    '/commitments',
    '/workspaces',
    '/rental-agreement',
    '/collection-emails'
  ];

  // Check if this is a protected path
  const isProtectedPath = protectedPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Read auth cookie set on login
  const authCookie = request.cookies.get('wpa_auth');
  const isAuthenticated = !!authCookie?.value;

  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // propagate cookie to downstream if present
  const response = NextResponse.next();
  return response;
}

export const config = {
  // Restrict to application routes while excluding Next internals and static assets.
  // Avoids invalid route source patterns that use capturing groups.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
};
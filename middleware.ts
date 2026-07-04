import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales } from './config';
import { updateSession } from '@/app/lib/supabase/middleware';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'zh',
  localePrefix: 'always'
});

// Define public paths that don't require authentication
const publicPaths = ['/login', '/auth/callback', '/terms', '/privacy'];
const crawlerFiles = ['/robots.txt', '/llms.txt', '/sitemap.xml'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    crawlerFiles.includes(pathname) ||
    pathname.includes('googledbc7bada3b49d51f.html')
  ) {
    return NextResponse.next();
  }
  // First, handle internationalization
  const response = intlMiddleware(request);
  
  // If intl middleware returned a redirect, return it
  if (response && response.status === 307) {
    return response;
  }
  
  // Get the locale from the pathname
  const locale = pathname.split('/')[1];
  
  // Check if the path is public (home, login, auth callback, etc.)
  const isLocaleHome = locales.includes(locale as (typeof locales)[number]) && pathname === `/${locale}`;
  const isPublicPath = isLocaleHome || publicPaths.some(path => pathname.includes(`/${locale}${path}`));
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Handle authentication
  return await updateSession(request);
}

// Only run the middleware on these paths
export const config = {
  matcher: [
    // Match all paths except static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|llms.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

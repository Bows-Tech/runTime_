import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

function detectLocale(request: NextRequest): string {
  const fromCookie = request.cookies.get('locale')?.value;
  if (fromCookie && locales.includes(fromCookie as never)) return fromCookie;

  const header = request.headers.get('accept-language') || '';
  for (const part of header.split(',')) {
    const code = part.split(';')[0]?.trim().slice(0, 2).toLowerCase();
    if (code && locales.includes(code as never)) return code;
  }
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas internas que no llevan prefijo de idioma.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

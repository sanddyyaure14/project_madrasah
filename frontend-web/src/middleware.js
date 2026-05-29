import { NextResponse } from 'next/server';

export function middleware(request) {
  // Ambil path URL saat ini
  const path = request.nextUrl.pathname;

  // Cek apakah user sudah login dengan mengecek keberadaan cookie
  const isLoggedIn = request.cookies.has('isLoggedIn');

  // Daftar halaman publik yang tidak perlu login
  const isPublicPath = path === '/login' || path === '/register';

  // Jika user belum login dan mencoba akses halaman yang dilindungi (selain login/register)
  if (!isPublicPath && !isLoggedIn) {
    // Arahkan kembali ke halaman login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika user sudah login tapi mencoba akses halaman login
  if (isPublicPath && isLoggedIn) {
    // Arahkan ke dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Tentukan route mana saja yang akan dilewati oleh middleware ini
export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

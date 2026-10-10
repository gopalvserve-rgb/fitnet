import { NextResponse } from 'next/server';

const IMAGE_HOSTS = 'https://images.unsplash.com https://cdn.gamma.app';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${IMAGE_HOSTS};
    font-src 'self';
    connect-src 'self'${isDev ? ' ws:' : ''};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? '' : 'upgrade-insecure-requests;'}
  `.replace(/\s{2,}/g, ' ').trim();

  // Cheap UX gate only; the API enforces auth on every admin call.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !request.cookies.has('vw_session')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api/|_next/static|_next/image|favicon.ico|icon.svg).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

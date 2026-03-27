import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isAdminPage = request.nextUrl.pathname.startsWith('/4_administrador');
    const token = request.cookies.get('accessToken')?.value;

    // If trying to access admin page without a token, redirect to home (or login page if it existed separately)
    // For now, let's keep it simple: redirect home if no token.
    if (isAdminPage && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/4_administrador/:path*'],
};

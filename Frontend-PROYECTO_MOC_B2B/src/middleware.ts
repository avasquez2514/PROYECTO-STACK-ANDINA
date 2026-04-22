import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Global de Next.js
 * 
 * Este interceptor se ejecuta en el Edge y valida la existencia del `accessToken`
 * antes de permitir el acceso a rutas restringidas (como el Admin).
 * Si el usuario no está autenticado, realiza un "Force Redirect" hacia `/login`.
 * 
 * @param {NextRequest} request - Objeto de petición entrante.
 * @returns {NextResponse} Respuesta de navegación (Next o Redirect).
 */
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

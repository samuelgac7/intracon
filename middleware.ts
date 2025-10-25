import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔷 Middleware - Pathname:', pathname)

  // Rutas públicas que no requieren autenticación
  const rutasPublicas = ['/login', '/recuperar-password', '/auth/callback', '/test-solicitudes']

  if (rutasPublicas.includes(pathname) || pathname.startsWith('/auth/')) {
    console.log('✅ Middleware - Ruta pública permitida:', pathname)
    return NextResponse.next()
  }

  console.log('🔒 Middleware - Verificando autenticación para:', pathname)
  
  // Verificar si hay sesión en cookies
  const sesionCookie = request.cookies.get('sesion_tecnycon')
  
  if (!sesionCookie) {
    // No hay sesión, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    const sesion = JSON.parse(sesionCookie.value)
    const rol = sesion.rol
    
    // Protección de rutas según rol
    const rutasRestringidas: Record<string, string[]> = {
      '/configuracion/usuarios': ['administrador', 'gerente', 'super-admin'],
      '/configuracion/auditoria': ['gerente', 'super-admin'],
      '/configuracion/sistema': ['super-admin']
    }
    
    // Verificar si la ruta actual está restringida
    for (const [ruta, rolesPermitidos] of Object.entries(rutasRestringidas)) {
      if (pathname.startsWith(ruta) && !rolesPermitidos.includes(rol)) {
        // Usuario no tiene permiso, redirigir a dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    // Dashboard personalizado por rol
    if (pathname === '/dashboard') {
      // Agregar header con el rol para que el componente sepa qué dashboard mostrar
      const response = NextResponse.next()
      response.headers.set('x-user-role', rol)
      return response
    }
    
    return NextResponse.next()
    
  } catch (error) {
    // Error parseando sesión, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
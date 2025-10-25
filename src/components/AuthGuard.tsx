"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { sesion } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Pequeño delay para permitir que Zustand hidrate
    const timer = setTimeout(() => {
      const rutasPublicas = ['/login', '/recuperar-password', '/auth/callback', '/test-solicitudes']

      // Permitir rutas públicas sin verificación
      if (rutasPublicas.includes(pathname) || pathname.startsWith('/auth/')) {
        setIsChecking(false)
        return
      }

      // Si no hay sesión y no es ruta pública, redirigir a login
      if (!sesion) {
        router.push('/login')
        return
      }

      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, router, sesion])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
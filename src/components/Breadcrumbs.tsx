"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { breadcrumbsConfig, rutasExcluidas } from '@/lib/breadcrumbsConfig'
import { useEffect, useState } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  useEffect(() => {
    const generarBreadcrumbs = async () => {
      // No mostrar breadcrumbs en rutas excluidas
      if (rutasExcluidas.includes(pathname)) {
        setBreadcrumbs([])
        return
      }

      const segmentos = pathname.split('/').filter(Boolean)
      const items: BreadcrumbItem[] = []

      for (let i = 0; i < segmentos.length; i++) {
        const segmento = segmentos[i]
        const ruta = '/' + segmentos.slice(0, i + 1).join('/')
        const esUltimo = i === segmentos.length - 1

        let label = breadcrumbsConfig[segmento] || segmento

        // Si es un ID numérico, intentar obtener el nombre desde BD
        if (/^\d+$/.test(segmento)) {
          const segmentoAnterior = segmentos[i - 1]

          try {
            if (segmentoAnterior === 'trabajadores') {
              const { trabajadoresService } = await import('@/services/trabajadores')
              const trabajador = await trabajadoresService.getById(parseInt(segmento))
              label = trabajador?.nombre || `Trabajador #${segmento}`
            } else if (segmentoAnterior === 'obras') {
              const { obrasService } = await import('@/services/obras')
              const obra = await obrasService.getById(parseInt(segmento))
              label = obra?.nombre || `Obra #${segmento}`
            }
          } catch (error) {
            console.error('Error obteniendo nombre para breadcrumb:', error)
            label = `#${segmento}`
          }
        }

        items.push({
          label,
          href: ruta,
          isLast: esUltimo
        })
      }

      setBreadcrumbs(items)
    }

    generarBreadcrumbs()
  }, [pathname])

  // No mostrar si no hay breadcrumbs
  if (breadcrumbs.length === 0) return null

  return (
    <nav
      className="flex items-center gap-2 py-3 px-6 bg-white border-b border-gray-200 text-sm sticky top-0 z-10 shadow-sm"
      aria-label="Breadcrumb"
    >
      {/* Home */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-gray-600 hover:text-[#0066cc] transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Inicio</span>
      </Link>

      {/* Separador */}
      {breadcrumbs.length > 0 && (
        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}

      {/* Breadcrumbs dinámicos */}
      {breadcrumbs.map((item) => (
        <div key={item.href} className="flex items-center gap-2">
          {item.isLast ? (
            <span className="text-gray-900 font-medium truncate max-w-xs" title={item.label}>
              {item.label}
            </span>
          ) : (
            <>
              <Link
                href={item.href}
                className="text-gray-600 hover:text-[#0066cc] transition-colors truncate max-w-xs"
                title={item.label}
              >
                {item.label}
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </>
          )}
        </div>
      ))}
    </nav>
  )
}

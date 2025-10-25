"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Building2, Settings, ShoppingCart, DollarSign, Headphones, Calculator, FileCheck, UserPlus, ChevronRight, FileText } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery"
import { useDataRefreshListener } from "@/hooks/useDataRefresh"
import { useCallback, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

interface SubMenuItem {
  name: string
  href: string
  icon?: React.ReactNode
  badge?: number
}

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
  color?: string
  subItems?: SubMenuItem[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const { sesion, usuario } = useAuth()
  const rolActual = sesion?.rol
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Recursos Humanos']) // Expandido por defecto

  // Hook para trabajadores activos con refetch
  const trabajadoresQuery = useSupabaseQuery({
    queryKey: ['trabajadores-activos', usuario?.id],
    queryFn: async () => {
      const { trabajadoresService } = await import('@/services/trabajadores')
      let trabajadores = await trabajadoresService.getActivos()

      // Filtrar por obras asignadas al usuario si corresponde
      if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
        // Obtener IDs de trabajadores asignados a las obras del usuario
        const { supabase } = await import('@/lib/supabase')
        const { data: asignaciones } = await supabase
          .from('trabajadores_obras')
          .select('trabajador_id')
          .in('obra_id', usuario.obras_asignadas)
          .eq('activo', true)

        const trabajadorIds = new Set(asignaciones?.map(a => a.trabajador_id) || [])
        trabajadores = trabajadores.filter(t => trabajadorIds.has(t.id))
      }

      return trabajadores
    },
    enabled: !!sesion // Solo ejecutar si hay sesión
  })

  // Hook para TODAS las obras (no solo en progreso)
  const obrasQuery = useSupabaseQuery({
    queryKey: ['obras-todas', usuario?.id],
    queryFn: async () => {
      const { obrasService } = await import('@/services/obras')
      let obras = await obrasService.getAll()

      // Filtrar por obras asignadas al usuario si corresponde
      if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
        obras = obras.filter(obra => usuario.obras_asignadas!.includes(obra.id))
      }

      return obras
    },
    enabled: !!sesion // Solo ejecutar si hay sesión
  })

  // Hook para solicitudes de acceso pendientes (solo para super-admin)
  const solicitudesQuery = useSupabaseQuery({
    queryKey: 'solicitudes-acceso-pendientes',
    queryFn: async () => {
      if (rolActual !== 'super-admin') return 0
      const solicitudesService = (await import('@/services/solicitudesAcceso')).default
      return await solicitudesService.countPendientes()
    },
    enabled: rolActual === 'super-admin'
  })

  // Refetch cuando se crean/actualizan trabajadores
  const handleTrabajadorChange = useCallback(() => {
    if (trabajadoresQuery.refetch) {
      trabajadoresQuery.refetch()
    }
  }, []) // Sin dependencias para evitar loops

  // Refetch cuando se crean/actualizan obras
  const handleObraChange = useCallback(() => {
    if (obrasQuery.refetch) {
      obrasQuery.refetch()
    }
  }, []) // Sin dependencias para evitar loops

  // Escuchar eventos de cambios en trabajadores
  useDataRefreshListener(
    ['trabajador-created', 'trabajador-updated', 'trabajador-deleted'],
    handleTrabajadorChange
  )

  // Escuchar eventos de cambios en obras
  useDataRefreshListener(
    ['obra-created', 'obra-updated', 'obra-deleted'],
    handleObraChange
  )

  const trabajadoresCount = trabajadoresQuery.data?.length || 0
  const obrasCount = obrasQuery.data?.length || 0
  const solicitudesPendientes = typeof solicitudesQuery.data === 'number' ? solicitudesQuery.data : 0

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      color: "#0066cc"
    },
    {
      name: "Recursos Humanos",
      href: "/recursos-humanos",
      icon: <Users className="h-5 w-5" />,
      color: "#10b981",
      subItems: [
        {
          name: "Trabajadores",
          href: "/trabajadores",
          icon: <Users className="h-4 w-4" />,
          badge: trabajadoresCount
        },
        {
          name: "Gestión Documental",
          href: "/recursos-humanos/documentacion",
          icon: <FileText className="h-4 w-4" />
        }
      ]
    },
    {
      name: "Obras",
      href: "/obras",
      icon: <Building2 className="h-5 w-5" />,
      badge: obrasCount,
      color: "#f59e0b"
    },
    {
      name: "Adquisiciones",
      href: "/adquisiciones",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "#8b5cf6"
    },
    {
      name: "Finanzas",
      href: "/finanzas",
      icon: <DollarSign className="h-5 w-5" />,
      color: "#059669"
    },
    {
      name: "Post-Venta",
      href: "/postventa",
      icon: <Headphones className="h-5 w-5" />,
      color: "#0891b2"
    },
    {
      name: "Contabilidad",
      href: "/contabilidad",
      icon: <Calculator className="h-5 w-5" />,
      color: "#dc2626"
    },
    {
      name: "Solicitudes",
      href: "/solicitudes",
      icon: <FileCheck className="h-5 w-5" />,
      color: "#ea580c"
    },
    // Mostrar "Configuración" solo para super-admin
    ...(rolActual === 'super-admin' ? [{
      name: "Configuración",
      href: "/configuracion",
      icon: <Settings className="h-5 w-5" />,
      color: "#6b7280"
    }] : []),
    // Mostrar "Solicitudes de Acceso" solo para super-admin
    ...(rolActual === 'super-admin' ? [{
      name: "Solicitudes Acceso",
      href: "/solicitudes-acceso",
      icon: <UserPlus className="h-5 w-5" />,
      badge: solicitudesPendientes > 0 ? solicitudesPendientes : undefined,
      color: "#ec4899"
    }] : [])
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    // Evitar que /solicitudes coincida con /solicitudes-acceso
    if (href === "/solicitudes") {
      return pathname === "/solicitudes" || pathname.startsWith("/solicitudes/")
    }
    // Para Recursos Humanos, verificar si algún sub-item está activo
    if (href === "/recursos-humanos") {
      return pathname.startsWith("/trabajadores") || pathname.startsWith("/recursos-humanos")
    }
    return pathname.startsWith(href)
  }

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    )
  }

  return (
    <aside className="w-64 bg-[#1a2332] text-white flex flex-col flex-shrink-0 shadow-2xl">
      <div className="h-16 flex items-center px-6 border-b border-gray-700/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: '#0066cc' }}>
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">TECNYCON</div>
            <div className="text-xs text-gray-400">Constructora</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const isExpanded = expandedMenus.includes(item.name)
          const hasSubItems = item.subItems && item.subItems.length > 0

          return (
            <div key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {hasSubItems ? (
                    <div className="relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                          active
                            ? "bg-white/10 text-white shadow-lg"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {active && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                            style={{ backgroundColor: item.color || '#0066cc' }}
                          />
                        )}

                        <div className={cn(
                          "flex-shrink-0 transition-all duration-200",
                          active ? "scale-110" : "group-hover:scale-110"
                        )}>
                          <div
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              active ? "bg-white/10" : "group-hover:bg-white/5"
                            )}
                            style={active ? { backgroundColor: `${item.color}20` } : undefined}
                          >
                            <div style={active ? { color: item.color } : undefined}>
                              {item.icon}
                            </div>
                          </div>
                        </div>

                        <span className="flex-1 text-left">{item.name}</span>

                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge
                            className="text-xs font-semibold px-2 py-0.5 transition-all duration-300"
                            style={{
                              backgroundColor: active ? item.color : '#374151',
                              color: 'white'
                            }}
                          >
                            {item.badge}
                          </Badge>
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleMenu(item.name)
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </button>

                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                        active
                          ? "bg-white/10 text-white shadow-lg"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {active && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                          style={{ backgroundColor: item.color || '#0066cc' }}
                        />
                      )}

                      <div className={cn(
                        "flex-shrink-0 transition-all duration-200",
                        active ? "scale-110" : "group-hover:scale-110"
                      )}>
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            active ? "bg-white/10" : "group-hover:bg-white/5"
                          )}
                          style={active ? { backgroundColor: `${item.color}20` } : undefined}
                        >
                          <div style={active ? { color: item.color } : undefined}>
                            {item.icon}
                          </div>
                        </div>
                      </div>

                      <span className="flex-1">{item.name}</span>

                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          className="ml-auto text-xs font-semibold px-2 py-0.5 transition-all duration-300 animate-in fade-in-50"
                          style={{
                            backgroundColor: active ? item.color : '#374151',
                            color: 'white'
                          }}
                        >
                          {item.badge}
                        </Badge>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-semibold">{item.name}</p>
                  {item.badge !== undefined && item.badge > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.name === "Recursos Humanos" && "Trabajadores activos"}
                      {item.name === "Obras" && "Total de obras"}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Sub-items */}
              {hasSubItems && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems!.map((subItem) => {
                    const subActive = pathname.startsWith(subItem.href)
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 group",
                          subActive
                            ? "bg-white/10 text-white font-medium"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        )}
                      >
                        {subItem.icon && (
                          <div style={subActive ? { color: item.color } : undefined}>
                            {subItem.icon}
                          </div>
                        )}
                        <span className="flex-1">{subItem.name}</span>
                        {subItem.badge !== undefined && subItem.badge > 0 && (
                          <Badge
                            className="text-xs font-semibold px-2 py-0.5 transition-all duration-300"
                            style={{
                              backgroundColor: subActive ? item.color : '#374151',
                              color: 'white'
                            }}
                          >
                            {subItem.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700/50">
        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-400">Sistema Operativo</span>
          </div>
          <div className="text-xs text-gray-500">
            Versión 1.0.0
          </div>
        </div>
      </div>
    </aside>
  )
}

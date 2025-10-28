"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, User, Settings, LogOut, ChevronDown, Users, Building2, FileText, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import ConfirmDialog from "@/components/ConfirmDialog"
import { useAuth } from "@/hooks/useAuth"
import NotificacionesPanel from "@/components/NotificacionesPanel"
import { notificacionesService } from "@/services/notificaciones"
import {
  buscarGlobal,
  guardarBusquedaReciente,
  type ResultadosBusqueda
} from '@/services/busqueda'

export default function Header() {
  const router = useRouter()
  const { addToast } = useToast()
  const { sesion, usuario, logout } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Estados para búsqueda inline
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadosBusqueda | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Estados para notificaciones
  const [notificacionesOpen, setNotificacionesOpen] = useState(false)
  const [contadorNoLeidas, setContadorNoLeidas] = useState(0)

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    const cargarContador = async () => {
      if (!sesion?.usuarioId) return

      const conteo = await notificacionesService.contarNoLeidas(sesion.usuarioId)
      setContadorNoLeidas(conteo)
    }

    cargarContador()

    // Actualizar cada 60 segundos
    const interval = setInterval(cargarContador, 60000)

    return () => clearInterval(interval)
  }, [sesion?.usuarioId])

  // Búsqueda con debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResultados(null)
      setShowResults(false)
      return
    }

    setLoading(true)
    setShowResults(true)

    const timeout = setTimeout(async () => {
      try {
        const res = await buscarGlobal(
          query,
          20,
          sesion?.usuarioId,
          usuario?.obras_asignadas || undefined
        )
        setResultados(res)
      } catch (error) {
        console.error('Error en búsqueda:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, sesion, usuario])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout() // Usar el hook useAuth para cerrar sesión (reemplaza localStorage)

    // Eliminar cookie de sesión
    document.cookie = 'sesion_tecnycon=; path=/; max-age=0; SameSite=Lax'

    addToast({
      type: "success",
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente"
    })
    setTimeout(() => {
      router.push('/login')
    }, 500)
  }

  const getInitials = (nombre: string) => {
    const parts = nombre.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return nombre.substring(0, 2).toUpperCase()
  }

  const getRolTexto = (rol: string) => {
    const roles: Record<string, string> = {
      'profesional': 'Profesional',
      'visitador': 'Visitador',
      'gerente': 'Gerente',
      'super-admin': 'Super Admin'
    }
    return roles[rol] || 'Usuario'
  }

  const getRolColor = (rol: string) => {
    const colors: Record<string, string> = {
      'profesional': 'bg-green-100 text-green-800',
      'visitador': 'bg-blue-100 text-blue-800',
      'gerente': 'bg-purple-100 text-purple-800',
      'super-admin': 'bg-red-100 text-red-800'
    }
    return colors[rol] || 'bg-gray-100 text-gray-800'
  }

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'trabajador': return <Users className="h-4 w-4" />
      case 'obra': return <Building2 className="h-4 w-4" />
      case 'documento': return <FileText className="h-4 w-4" />
      case 'contrato': return <FileCheck className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const getColorBadge = (tipo: string) => {
    switch (tipo) {
      case 'trabajador': return 'bg-blue-100 text-blue-800'
      case 'obra': return 'bg-orange-100 text-orange-800'
      case 'documento': return 'bg-purple-100 text-purple-800'
      case 'contrato': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSeleccionar = (link: string) => {
    guardarBusquedaReciente(query)
    setQuery('')
    setShowResults(false)
    setResultados(null)
    router.push(link)
  }

  return (
    <>
      <header className="h-16 border-b bg-white px-6 flex items-center justify-between flex-shrink-0 shadow-sm animate-fade-in">
        {/* Búsqueda Inline */}
        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowResults(true)}
              placeholder="Buscar trabajadores, obras, documentos..."
              className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent"
            />
          </div>

          {/* Dropdown de resultados */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto z-50">
              {loading && (
                <div className="py-8 text-center text-sm text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#0066cc] border-t-transparent"></div>
                  <p className="mt-2">Buscando...</p>
                </div>
              )}

              {!loading && resultados && resultados.total === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No se encontraron resultados para &quot;{query}&quot;</p>
                </div>
              )}

              {!loading && resultados && resultados.total > 0 && (
                <div className="p-2">
                  {resultados.trabajadores.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Trabajadores ({resultados.trabajadores.length})
                      </div>
                      {resultados.trabajadores.map((item) => (
                        <button
                          key={`trabajador-${item.id}`}
                          onClick={() => handleSeleccionar(item.link)}
                          className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left flex items-start gap-3 group"
                        >
                          <div className="mt-0.5 text-blue-600">
                            {getIcono(item.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm group-hover:text-[#0066cc] transition-colors">
                              {item.titulo}
                            </div>
                            {item.subtitulo && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.subtitulo}</div>
                            )}
                          </div>
                          <Badge className={`text-xs ${getColorBadge(item.tipo)}`}>
                            {item.tipo}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultados.obras.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Obras ({resultados.obras.length})
                      </div>
                      {resultados.obras.map((item) => (
                        <button
                          key={`obra-${item.id}`}
                          onClick={() => handleSeleccionar(item.link)}
                          className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left flex items-start gap-3 group"
                        >
                          <div className="mt-0.5 text-orange-600">
                            {getIcono(item.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm group-hover:text-[#0066cc] transition-colors">
                              {item.titulo}
                            </div>
                            {item.subtitulo && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.subtitulo}</div>
                            )}
                          </div>
                          <Badge className={`text-xs ${getColorBadge(item.tipo)}`}>
                            {item.tipo}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultados.documentos.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Documentos ({resultados.documentos.length})
                      </div>
                      {resultados.documentos.map((item) => (
                        <button
                          key={`documento-${item.id}`}
                          onClick={() => handleSeleccionar(item.link)}
                          className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left flex items-start gap-3 group"
                        >
                          <div className="mt-0.5 text-purple-600">
                            {getIcono(item.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm group-hover:text-[#0066cc] transition-colors">
                              {item.titulo}
                            </div>
                            {item.subtitulo && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.subtitulo}</div>
                            )}
                          </div>
                          <Badge className={`text-xs ${getColorBadge(item.tipo)}`}>
                            {item.tipo}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultados.contratos.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Contratos ({resultados.contratos.length})
                      </div>
                      {resultados.contratos.map((item) => (
                        <button
                          key={`contrato-${item.id}`}
                          onClick={() => handleSeleccionar(item.link)}
                          className="w-full px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left flex items-start gap-3 group"
                        >
                          <div className="mt-0.5 text-green-600">
                            {getIcono(item.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm group-hover:text-[#0066cc] transition-colors">
                              {item.titulo}
                            </div>
                            {item.subtitulo && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.subtitulo}</div>
                            )}
                          </div>
                          <Badge className={`text-xs ${getColorBadge(item.tipo)}`}>
                            {item.tipo}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {/* Notificaciones */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-gray-100 transition-all hover:scale-110"
                  onClick={() => setNotificacionesOpen(!notificacionesOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {contadorNoLeidas > 0 && (
                    <>
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {contadorNoLeidas > 9 ? '9+' : contadorNoLeidas}
                      </span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notificaciones {contadorNoLeidas > 0 ? `(${contadorNoLeidas} nuevas)` : ''}</p>
              </TooltipContent>
            </Tooltip>

            {/* Panel de notificaciones */}
            <NotificacionesPanel
              isOpen={notificacionesOpen}
              onClose={() => setNotificacionesOpen(false)}
            />
          </div>

          {/* Perfil Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-3 hover:bg-gray-100 transition-all">
                <Avatar className="h-9 w-9 ring-2 ring-gray-200 transition-all hover:ring-[#0066cc]">
                  {usuario?.foto ? (
                    <AvatarImage src={usuario.foto} alt={usuario?.nombre || 'Usuario'} />
                  ) : (
                    <AvatarFallback style={{ backgroundColor: '#0066cc' }} className="text-white text-sm font-semibold">
                      {usuario ? getInitials(usuario.nombre) : 'US'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-semibold text-gray-900">{usuario?.nombre || 'Usuario'}</div>
                  <div className="text-xs text-gray-500">{usuario?.cargo || 'Cargo'}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-12 w-12">
                    {usuario?.foto ? (
                      <AvatarImage src={usuario.foto} alt={usuario?.nombre || 'Usuario'} />
                    ) : (
                      <AvatarFallback style={{ backgroundColor: '#0066cc' }} className="text-white">
                        {usuario ? getInitials(usuario.nombre) : 'US'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{usuario?.nombre || 'Usuario'}</div>
                    <div className="text-xs text-gray-500 truncate">{usuario?.cargo || 'Cargo'}</div>
                    <Badge className={`mt-1 text-xs ${usuario ? getRolColor(usuario.rol) : ''}`}>
                      {usuario ? getRolTexto(usuario.rol) : 'Usuario'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  if (sesion?.usuarioId) {
                    router.push(`/trabajadores/${sesion.usuarioId}`)
                    addToast({
                      type: "info",
                      title: "Mi Perfil",
                      description: "Cargando tu perfil..."
                    })
                  }
                }}
              >
                <User className="h-4 w-4 mr-3 text-gray-600" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  router.push('/cambiar-password')
                }}
              >
                <Settings className="h-4 w-4 mr-3 text-gray-600" />
                <span>Cambiar Contraseña</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push('/configuracion')}
              >
                <Settings className="h-4 w-4 mr-3 text-gray-600" />
                <span>Configuración</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                className="text-red-600 cursor-pointer hover:bg-red-50 transition-colors focus:bg-red-50 focus:text-red-600"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span className="font-medium">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="¿Cerrar sesión?"
        description="¿Estás seguro que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder."
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        onConfirm={handleLogout}
        variant="destructive"
      />
    </>
  )
}
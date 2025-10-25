"use client"

import { useState } from "react"
import { Search, Bell, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
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

export default function Header() {
  const router = useRouter()
  const { addToast } = useToast()
  const { sesion: usuario, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

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

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      addToast({
        type: "info",
        title: "Búsqueda",
        description: `Buscando: "${searchQuery}"`
      })
    }
  }

  return (
    <>
      <header className="h-16 border-b bg-white px-6 flex items-center justify-between flex-shrink-0 shadow-sm animate-fade-in">
        {/* Búsqueda */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
            <Input
              type="text"
              placeholder="Buscar trabajadores, obras, documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {/* Notificaciones */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-gray-100 transition-all hover:scale-110"
                onClick={() => addToast({
                  type: "info",
                  title: "Notificaciones",
                  description: "No tienes notificaciones nuevas"
                })}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notificaciones (3 nuevas)</p>
            </TooltipContent>
          </Tooltip>

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
                  if (usuario?.trabajadorId) {
                    router.push(`/trabajadores/${usuario.trabajadorId}`)
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
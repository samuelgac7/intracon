"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, CheckCheck, FileText, AlertCircle, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import {
  notificacionesService,
  type Notificacion
} from '@/services/notificaciones'

interface NotificacionesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificacionesPanel({ isOpen, onClose }: NotificacionesPanelProps) {
  const router = useRouter()
  const { sesion } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [noLeidas, setNoLeidas] = useState(0)

  const cargarNotificaciones = useCallback(async () => {
    if (!sesion?.usuarioId) return

    setLoading(true)
    try {
      const [notifs, conteo] = await Promise.all([
        notificacionesService.getNotificacionesUsuario(sesion.usuarioId, 20),
        notificacionesService.contarNoLeidas(sesion.usuarioId)
      ])

      setNotificaciones(notifs)
      setNoLeidas(conteo)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }, [sesion?.usuarioId])

  // Cargar al abrir
  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones()
    }
  }, [isOpen, cargarNotificaciones])

  // Polling cada 60 segundos cuando está abierto
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      cargarNotificaciones()
    }, 60000)

    return () => clearInterval(interval)
  }, [isOpen, cargarNotificaciones])

  const handleMarcarLeida = async (notificacionId: number, link?: string) => {
    await notificacionesService.marcarComoLeida(notificacionId)

    // Actualizar estado local
    setNotificaciones(prev =>
      prev.map(n => n.id === notificacionId ? { ...n, leida: true } : n)
    )
    setNoLeidas(prev => Math.max(0, prev - 1))

    // Navegar si hay link
    if (link) {
      onClose()
      router.push(link)
    }
  }

  const handleMarcarTodasLeidas = async () => {
    if (!sesion?.usuarioId) return

    await notificacionesService.marcarTodasComoLeidas(sesion.usuarioId)

    // Actualizar estado local
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  const handleEliminar = async (notificacionId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    await notificacionesService.eliminarNotificacion(notificacionId)

    // Actualizar estado local
    setNotificaciones(prev => prev.filter(n => n.id !== notificacionId))

    // Decrementar contador si no estaba leída
    const notif = notificaciones.find(n => n.id === notificacionId)
    if (notif && !notif.leida) {
      setNoLeidas(prev => Math.max(0, prev - 1))
    }
  }

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'contrato_por_vencer':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'documento_vencido':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'solicitud_acceso_pendiente':
        return <Bell className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTiempoTranscurrido = (fecha: string): string => {
    const ahora = new Date()
    const fechaNotif = new Date(fecha)
    const diferencia = ahora.getTime() - fechaNotif.getTime()

    const minutos = Math.floor(diferencia / 60000)
    if (minutos < 1) return 'Ahora'
    if (minutos === 1) return 'Hace 1 minuto'
    if (minutos < 60) return `Hace ${minutos} minutos`

    const horas = Math.floor(minutos / 60)
    if (horas === 1) return 'Hace 1 hora'
    if (horas < 24) return `Hace ${horas} horas`

    const dias = Math.floor(horas / 24)
    if (dias === 1) return 'Hace 1 día'
    if (dias < 7) return `Hace ${dias} días`

    const semanas = Math.floor(dias / 7)
    if (semanas === 1) return 'Hace 1 semana'
    return `Hace ${semanas} semanas`
  }

  if (!isOpen) return null

  return (
    <div
      className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          {noLeidas > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-2">
              {noLeidas}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarcarTodasLeidas}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0066cc] border-t-transparent"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No tienes notificaciones</p>
            <p className="text-xs text-gray-400 mt-1">
              Te notificaremos cuando haya algo nuevo
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`
                  p-4 cursor-pointer transition-all hover:bg-gray-50 relative group
                  ${!notif.leida ? 'bg-blue-50/30' : ''}
                `}
                onClick={() => handleMarcarLeida(notif.id, notif.link || undefined)}
              >
                {/* Indicador de no leída */}
                {!notif.leida && (
                  <div className="absolute left-2 top-6 h-2 w-2 bg-blue-500 rounded-full"></div>
                )}

                <div className="flex gap-3 ml-2">
                  {/* Ícono */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcono(notif.tipo)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.leida ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                        {notif.titulo}
                      </p>

                      {/* Botón eliminar (visible en hover) */}
                      <button
                        onClick={(e) => handleEliminar(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>

                    {notif.mensaje && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notif.mensaje}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {getTiempoTranscurrido(notif.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notificaciones.length > 0 && (
        <div className="border-t border-gray-200 p-2">
          <Button
            variant="ghost"
            className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => {
              onClose()
              // TODO: Navegar a página de todas las notificaciones
              // router.push('/notificaciones')
            }}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      )}
    </div>
  )
}

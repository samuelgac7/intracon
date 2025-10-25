"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, User, FileEdit } from 'lucide-react'
import { auditoriaAsistenciaService, RegistroAuditoria } from '@/services/auditoria-asistencia'

interface HistorialAsistenciaModalProps {
  open: boolean
  onClose: () => void
  registroId: number | null
  trabajadorNombre: string
  fecha: string
}

export default function HistorialAsistenciaModal({
  open,
  onClose,
  registroId,
  trabajadorNombre,
  fecha
}: HistorialAsistenciaModalProps) {
  const [historial, setHistorial] = useState<RegistroAuditoria[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && registroId) {
      cargarHistorial()
    }
  }, [open, registroId])

  const cargarHistorial = async () => {
    if (!registroId) return

    setLoading(true)
    try {
      const data = await auditoriaAsistenciaService.getHistorialCompleto(registroId)
      setHistorial(data)
    } catch (error) {
      console.error('Error al cargar historial:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Historial de Cambios
          </DialogTitle>
          <div className="text-sm text-gray-600">
            {trabajadorNombre} - {fecha}
          </div>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando historial...</span>
            </div>
          ) : historial.length === 0 ? (
            <div className="py-12 text-center">
              <FileEdit className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Sin modificaciones</p>
              <p className="text-sm text-gray-500 mt-1">
                Este registro no ha sido modificado desde su creación
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {historial.map((item, index) => {
                  const esUltimo = index === historial.length - 1
                  const tiempoRelativo = auditoriaAsistenciaService.formatTiempoRelativo(item.fecha_modificacion)
                  const campo = auditoriaAsistenciaService.formatCampo(item.campo_modificado)
                  const fechaFormatted = new Date(item.fecha_modificacion).toLocaleString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })

                  return (
                    <div key={item.id} className="relative flex gap-4 pb-6">
                      {/* Línea vertical */}
                      {!esUltimo && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                      )}

                      {/* Ícono */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileEdit className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{campo}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {tiempoRelativo}
                                </Badge>
                                <span className="text-xs text-gray-500">{fechaFormatted}</span>
                              </div>
                            </div>
                          </div>

                          {/* Cambio */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">Anterior</p>
                              <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                                <span className="text-sm font-medium text-red-900">
                                  {item.valor_anterior || '(vacío)'}
                                </span>
                              </div>
                            </div>

                            <div className="text-gray-400">→</div>

                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">Nuevo</p>
                              <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                                <span className="text-sm font-medium text-green-900">
                                  {item.valor_nuevo}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Usuario y motivo */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {item.usuario?.nombre || 'Sistema'}
                              </span>
                            </div>
                            {item.motivo && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                "{item.motivo}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumen */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>{historial.length}</strong> modificación{historial.length !== 1 ? 'es' : ''} registrada{historial.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

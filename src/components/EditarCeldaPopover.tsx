"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EstadoAsistencia, asistenciaUtils } from '@/services/asistencia'
import { ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react'

interface EditarCeldaPopoverProps {
  estado: EstadoAsistencia | null
  horasExtras: number
  observaciones?: string
  position: { top: number; left: number }
  fecha: Date  // Nueva prop para validaciones
  onGuardar: (estado: EstadoAsistencia | null, horasExtras: number, observaciones?: string) => void
  onCancelar: () => void
}

export default function EditarCeldaPopover({
  estado,
  horasExtras,
  observaciones,
  position,
  fecha,
  onGuardar,
  onCancelar
}: EditarCeldaPopoverProps) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoAsistencia | null>(estado)
  const [horas, setHoras] = useState(horasExtras)
  const [obs, setObs] = useState(observaciones || '')
  const [mostrarObservaciones, setMostrarObservaciones] = useState(!!observaciones)
  const popoverRef = useRef<HTMLDivElement>(null)

  const estados: EstadoAsistencia[] = ['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R']

  // Validaciones
  const esFechaFutura = fecha > new Date()
  const tieneHorasConEstadoInvalido = horas > 0 && estadoSeleccionado && ['F', 'L', 'R'].includes(estadoSeleccionado)

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelar()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleGuardar()
      } else {
        // Shortcuts de teclado para estados
        const key = e.key.toUpperCase()
        const estadoMap: Record<string, EstadoAsistencia> = {
          'O': 'OK',
          'F': 'F',
          'J': 'J',
          'A': 'A',
          'L': 'L',
          'B': 'BT',
          'T': 'BTR',
          'R': 'R'
        }
        if (estadoMap[key]) {
          setEstadoSeleccionado(estadoMap[key])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [estadoSeleccionado, horas, obs])

  // Click fuera para cerrar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancelar()
      }
    }

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGuardar = () => {
    // Validación: no permitir horas negativas
    const horasFinales = Math.max(0, horas)

    // Si hay horas con estado inválido, limpiar horas
    const horasGuardar = tieneHorasConEstadoInvalido ? 0 : horasFinales

    onGuardar(estadoSeleccionado, horasGuardar, obs || undefined)
  }

  const getColorEstado = (est: EstadoAsistencia) => {
    return asistenciaUtils.getColorEstado(est)
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '320px',
        maxHeight: '500px',
        overflow: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Marcar Asistencia</h4>
        <button
          onClick={onCancelar}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Alerta de fecha futura */}
      {esFechaFutura && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-800">Fecha futura</p>
            <p className="text-xs text-red-700">No se puede marcar asistencia en fechas futuras.</p>
          </div>
        </div>
      )}

      {/* Alerta de horas extras con estado inválido */}
      {tieneHorasConEstadoInvalido && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Inconsistencia detectada</p>
            <p className="text-xs text-amber-700">No puedes tener horas extras con estado {estadoSeleccionado}. Las horas se eliminarán al guardar.</p>
          </div>
        </div>
      )}

      {/* Estados */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {estados.map(est => (
          <button
            key={est}
            onClick={() => setEstadoSeleccionado(est)}
            className={`
              px-3 py-3 rounded-md font-bold text-sm transition-all
              ${estadoSeleccionado === est
                ? 'ring-2 ring-blue-500 shadow-md scale-105'
                : 'hover:scale-102 hover:shadow-sm'
              }
            `}
            style={{
              backgroundColor: getColorEstado(est),
              color: '#000'
            }}
            title={asistenciaUtils.getEtiquetaEstado(est)}
          >
            {est}
          </button>
        ))}
      </div>

      {/* Botón Limpiar */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEstadoSeleccionado(null)}
        className="w-full mb-3"
      >
        Limpiar Estado
      </Button>

      {/* Horas extras (solo si OK) */}
      {estadoSeleccionado === 'OK' && (
        <div className="mb-3 p-3 bg-orange-50 rounded-md border border-orange-200">
          <Label className="text-xs font-medium mb-1 block">Horas Extras</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={horas || ''}
            onChange={(e) => {
              const valor = parseFloat(e.target.value)
              // No permitir valores negativos
              setHoras(valor >= 0 ? valor : 0)
            }}
            placeholder="0"
            className="text-center font-bold"
            autoFocus={!estado}
          />
          <p className="text-xs text-gray-600 mt-1">
            El tipo (50% o 100%) se calcula automáticamente según el día
          </p>
        </div>
      )}

      {/* Observaciones colapsables */}
      <div className="mb-3">
        <button
          onClick={() => setMostrarObservaciones(!mostrarObservaciones)}
          className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
        >
          <span className="text-xs font-medium">Observaciones</span>
          {mostrarObservaciones ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {mostrarObservaciones && (
          <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Notas opcionales..."
              rows={3}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Shortcuts hint */}
      <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-gray-600">
        <p><kbd className="px-1 py-0.5 bg-white rounded border">O</kbd>=OK <kbd className="px-1 py-0.5 bg-white rounded border">F</kbd>=Falta <kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd>=Guardar <kbd className="px-1 py-0.5 bg-white rounded border">Esc</kbd>=Cancelar</p>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancelar}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          disabled={esFechaFutura}
          className="flex-1 text-white"
          style={{ backgroundColor: '#0066cc' }}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}

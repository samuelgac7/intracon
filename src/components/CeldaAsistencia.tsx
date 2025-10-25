"use client"

import { useState, useRef, useEffect } from 'react'
import { EstadoAsistencia, asistenciaUtils } from '@/services/asistencia'
import EditarCeldaPopover from './EditarCeldaPopover'
import HistorialAsistenciaModal from './HistorialAsistenciaModal'
import { Badge } from "@/components/ui/badge"
import { Clock } from 'lucide-react'
import { auditoriaAsistenciaService, RegistroAuditoria } from '@/services/auditoria-asistencia'
import { supabase } from '@/lib/supabase'

interface CeldaAsistenciaProps {
  trabajadorId: number
  dia: number
  mes: number
  anio: number
  estado: EstadoAsistencia | null
  horasExtras: number
  observaciones?: string
  esFinDeSemana: boolean
  esFeriado: boolean
  trabajadorNombre?: string
  onActualizar: (estado: EstadoAsistencia | null, horasExtras: number, observaciones?: string) => void
}

export default function CeldaAsistencia({
  trabajadorId,
  dia,
  mes,
  anio,
  estado,
  horasExtras,
  observaciones,
  esFinDeSemana,
  esFeriado,
  trabajadorNombre,
  onActualizar
}: CeldaAsistenciaProps) {
  const [mostrarPopover, setMostrarPopover] = useState(false)
  const [posicionPopover, setPosicionPopover] = useState({ top: 0, left: 0 })
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [ultimaModificacion, setUltimaModificacion] = useState<RegistroAuditoria | null>(null)
  const [registroId, setRegistroId] = useState<number | null>(null)
  const celdaRef = useRef<HTMLDivElement>(null)

  // Cargar ID del registro y última modificación si existe
  useEffect(() => {
    if (!estado) return

    const cargarAuditoria = async () => {
      try {
        const fechaStr = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`

        // Buscar el registro de asistencia
        const { data: registro, error } = await supabase
          .from('registros_asistencia')
          .select('id')
          .eq('trabajador_id', trabajadorId)
          .eq('fecha', fechaStr)
          .maybeSingle()

        if (error || !registro) return

        setRegistroId(registro.id)

        // Cargar última modificación
        const auditoria = await auditoriaAsistenciaService.getUltimaModificacion(registro.id)
        setUltimaModificacion(auditoria)
      } catch (error) {
        console.error('Error al cargar auditoría:', error)
      }
    }

    cargarAuditoria()
  }, [trabajadorId, dia, mes, anio, estado])

  const handleClick = () => {
    if (celdaRef.current) {
      const rect = celdaRef.current.getBoundingClientRect()
      const popoverWidth = 320
      const popoverHeight = 400

      // Calcular posición óptima del popover
      let top = rect.bottom + window.scrollY + 5
      let left = rect.left + window.scrollX

      // Ajustar si se sale de la pantalla por la derecha
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 20
      }

      // Ajustar si se sale de la pantalla por abajo
      if (rect.bottom + popoverHeight > window.innerHeight) {
        top = rect.top + window.scrollY - popoverHeight - 5
      }

      setPosicionPopover({ top, left })
      setMostrarPopover(true)
    }
  }

  const handleGuardar = (
    nuevoEstado: EstadoAsistencia | null,
    nuevasHoras: number,
    nuevasObs?: string
  ) => {
    onActualizar(nuevoEstado, nuevasHoras, nuevasObs)
    setMostrarPopover(false)
  }

  const getBackgroundColor = () => {
    // Si hay horas extras, usar color según tipo
    if (horasExtras > 0 && estado === 'OK') {
      // Determinar si es domingo/feriado para saber qué tipo de HE
      const fecha = new Date(anio, mes - 1, dia)
      const esDomingo = fecha.getDay() === 0
      const esDomingoOFeriado = esFeriado || esDomingo

      if (esDomingoOFeriado) {
        return '#D8BFD8' // HE 100% - Lila suave
      } else {
        return '#FAB4B4' // HE 50% - Rosado pálido
      }
    }

    if (!estado) {
      return esFinDeSemana || esFeriado ? '#f9fafb' : '#ffffff'
    }
    return asistenciaUtils.getColorEstado(estado)
  }

  const getBorderStyle = () => {
    if (esFinDeSemana) {
      return '2px dashed #d1d5db'
    }
    if (esFeriado) {
      return '2px solid #fbbf24'
    }
    return '1px solid #e5e7eb'
  }

  return (
    <>
      <div
        ref={celdaRef}
        onClick={handleClick}
        className="relative group cursor-pointer transition-all hover:shadow-md hover:scale-105 hover:z-10"
        style={{
          backgroundColor: getBackgroundColor(),
          border: getBorderStyle(),
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        {/* Contenido de la celda */}
        {horasExtras > 0 && estado === 'OK' ? (
          // Si hay horas extras, mostrar solo el número
          <span className="text-gray-900 font-bold">{horasExtras}</span>
        ) : estado ? (
          // Si no hay horas extras, mostrar estado
          <span className="text-gray-900">{estado}</span>
        ) : null}

        {/* Ícono de feriado */}
        {esFeriado && !estado && (
          <span className="absolute top-0.5 left-0.5 text-[10px]">🎉</span>
        )}

        {/* Indicador de observaciones */}
        {observaciones && (
          <div className="absolute bottom-0.5 left-0.5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </div>
        )}

        {/* Ícono de historial (si tiene modificaciones) */}
        {ultimaModificacion && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMostrarHistorial(true)
            }}
            className="absolute top-0.5 right-0.5 p-0.5 rounded hover:bg-black hover:bg-opacity-10 transition-colors opacity-0 group-hover:opacity-100"
            title="Ver historial"
          >
            <Clock className="h-3 w-3 text-gray-600" />
          </button>
        )}

        {/* Tooltip combinado (observaciones + auditoría) */}
        <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded shadow-lg">
          {observaciones && (
            <div className="mb-2 pb-2 border-b border-gray-700">
              <p className="font-semibold mb-1">Observaciones:</p>
              <p className="text-gray-300">{observaciones}</p>
            </div>
          )}
          {ultimaModificacion && (
            <div>
              <p className="font-semibold mb-1">Última modificación:</p>
              <p className="text-gray-300">
                {auditoriaAsistenciaService.formatTiempoRelativo(ultimaModificacion.fecha_modificacion)}
                {ultimaModificacion.usuario && (
                  <span className="block mt-1">
                    por {ultimaModificacion.usuario.nombre}
                  </span>
                )}
              </p>
              <p className="text-gray-400 text-[10px] mt-2">
                Click en <Clock className="inline h-2.5 w-2.5" /> para ver historial completo
              </p>
            </div>
          )}
          {!observaciones && !ultimaModificacion && (
            <p className="text-gray-400">Sin información adicional</p>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Popover de edición */}
      {mostrarPopover && (
        <EditarCeldaPopover
          estado={estado}
          horasExtras={horasExtras}
          observaciones={observaciones}
          position={posicionPopover}
          fecha={new Date(anio, mes - 1, dia)}
          onGuardar={handleGuardar}
          onCancelar={() => setMostrarPopover(false)}
        />
      )}

      {/* Modal de historial */}
      <HistorialAsistenciaModal
        open={mostrarHistorial}
        onClose={() => setMostrarHistorial(false)}
        registroId={registroId}
        trabajadorNombre={trabajadorNombre || `Trabajador ${trabajadorId}`}
        fecha={`${dia}/${mes}/${anio}`}
      />
    </>
  )
}

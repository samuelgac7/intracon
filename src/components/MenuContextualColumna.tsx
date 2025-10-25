"use client"

import { useEffect, useRef } from 'react'
import { EstadoAsistencia, asistenciaUtils } from '@/services/asistencia'

interface MenuContextualColumnaProps {
  position: { x: number; y: number }
  dia: number
  onMarcarTodos: (estado: EstadoAsistencia) => void
  onClose: () => void
}

export default function MenuContextualColumna({
  position,
  dia,
  onMarcarTodos,
  onClose
}: MenuContextualColumnaProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  const estados: EstadoAsistencia[] = ['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R']

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Cerrar con Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }, 100)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        minWidth: '220px'
      }}
    >
      <div className="mb-2 pb-2 border-b">
        <p className="text-xs font-semibold text-gray-600">Marcar día {dia} completo:</p>
      </div>

      <div className="space-y-1">
        {estados.map(estado => (
          <button
            key={estado}
            onClick={() => {
              onMarcarTodos(estado)
              onClose()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: asistenciaUtils.getColorEstado(estado),
                color: '#000'
              }}
            >
              {estado}
            </div>
            <span className="text-sm font-medium">
              {asistenciaUtils.getEtiquetaEstado(estado)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t">
        <button
          onClick={onClose}
          className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
        >
          Cancelar (Esc)
        </button>
      </div>
    </div>
  )
}

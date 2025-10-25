import { useState, useCallback, useEffect } from 'react'

export interface HistoryAction {
  type: 'celda' | 'columna'
  timestamp: number
  data: {
    trabajadorId?: number
    dia?: number
    estadoAnterior: string | null
    estadoNuevo: string | null
    horasAnterior: number
    horasNuevas: number
    observacionesAnterior?: string
    observacionesNuevas?: string
    // Para acciones de columna
    trabajadores?: Array<{
      id: number
      estadoAnterior: string | null
      horasAnterior: number
      observacionesAnterior?: string
    }>
  }
}

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([])
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([])

  // Agregar acción al historial
  const addAction = useCallback((action: HistoryAction) => {
    setUndoStack(prev => [...prev, action])
    setRedoStack([]) // Limpiar redo stack cuando se hace una nueva acción
  }, [])

  // Deshacer (Ctrl+Z)
  const undo = useCallback((): HistoryAction | null => {
    if (undoStack.length === 0) return null

    const action = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setRedoStack(prev => [...prev, action])

    return action
  }, [undoStack])

  // Rehacer (Ctrl+Y)
  const redo = useCallback((): HistoryAction | null => {
    if (redoStack.length === 0) return null

    const action = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    setUndoStack(prev => [...prev, action])

    return action
  }, [redoStack])

  // Limpiar historial (después de guardar)
  const clear = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
  }, [])

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z o Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Ctrl+Y o Cmd+Shift+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    addAction,
    undo,
    redo,
    clear
  }
}

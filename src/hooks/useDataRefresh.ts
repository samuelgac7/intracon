"use client"

import { useEffect, useCallback } from 'react'

/**
 * Sistema de eventos global para actualizar datos en toda la aplicación
 * Permite notificar cuando se crean, actualizan o eliminan entidades
 */

type RefreshEvent = 'trabajador-created' | 'trabajador-updated' | 'trabajador-deleted' |
                    'obra-created' | 'obra-updated' | 'obra-deleted'

class DataRefreshEmitter {
  private listeners: Map<RefreshEvent, Set<() => void>> = new Map()

  on(event: RefreshEvent, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: RefreshEvent, callback: () => void) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  emit(event: RefreshEvent) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback())
    }
  }
}

// Singleton global
const dataRefreshEmitter = new DataRefreshEmitter()

/**
 * Hook para emitir eventos de actualización de datos
 */
export function useDataRefreshEmitter() {
  const emitTrabajadorCreated = useCallback(() => {
    dataRefreshEmitter.emit('trabajador-created')
  }, [])

  const emitTrabajadorUpdated = useCallback(() => {
    dataRefreshEmitter.emit('trabajador-updated')
  }, [])

  const emitTrabajadorDeleted = useCallback(() => {
    dataRefreshEmitter.emit('trabajador-deleted')
  }, [])

  const emitObraCreated = useCallback(() => {
    dataRefreshEmitter.emit('obra-created')
  }, [])

  const emitObraUpdated = useCallback(() => {
    dataRefreshEmitter.emit('obra-updated')
  }, [])

  const emitObraDeleted = useCallback(() => {
    dataRefreshEmitter.emit('obra-deleted')
  }, [])

  return {
    emitTrabajadorCreated,
    emitTrabajadorUpdated,
    emitTrabajadorDeleted,
    emitObraCreated,
    emitObraUpdated,
    emitObraDeleted
  }
}

/**
 * Hook para escuchar eventos de actualización de datos
 */
export function useDataRefreshListener(events: RefreshEvent[], callback: () => void) {
  useEffect(() => {
    events.forEach(event => {
      dataRefreshEmitter.on(event, callback)
    })

    return () => {
      events.forEach(event => {
        dataRefreshEmitter.off(event, callback)
      })
    }
  }, [events, callback])
}

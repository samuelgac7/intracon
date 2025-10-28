"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSupabaseQueryOptions<T> {
  queryKey: string | unknown[]
  queryFn: () => Promise<T>
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseSupabaseQueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

/**
 * Hook personalizado para queries de Supabase con cache en memoria
 * Reemplaza el uso de localStorage para cachear datos
 * Similar a React Query pero más simple y específico para este proyecto
 */
export function useSupabaseQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  refetchInterval,
  onSuccess,
  onError
}: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Usar refs para funciones callback para evitar recrear fetchData
  const queryFnRef = useRef(queryFn)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    queryFnRef.current = queryFn
  }, [queryFn])

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  // Convertir queryKey a string estable
  const queryKeyString = typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await queryFnRef.current()
      setData(result)

      if (onSuccessRef.current) {
        onSuccessRef.current(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)

      // Log error pero no propagar para evitar loops
      console.error(`[useSupabaseQuery] Error en ${queryKeyString}:`, error instanceof Error ? error.message : String(error))

      if (onErrorRef.current) {
        onErrorRef.current(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [enabled, queryKeyString])

  useEffect(() => {
    fetchData()

    // Configurar refetch automático si se especifica
    if (refetchInterval && refetchInterval > 0 && enabled) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refetchInterval, enabled])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== null && error === null,
    refetch
  }
}

/**
 * Hook para obtener trabajadores activos (reemplaza localStorage cache)
 */
export function useTrabajadoresActivos() {
  return useSupabaseQuery({
    queryKey: 'trabajadores-activos',
    queryFn: async () => {
      const { trabajadoresService } = await import('@/services/trabajadores')
      const trabajadores = await trabajadoresService.getActivos()
      return trabajadores
    }
  })
}

/**
 * Hook para obtener obras en curso (reemplaza localStorage cache)
 */
export function useObrasEnCurso() {
  return useSupabaseQuery({
    queryKey: 'obras-en-curso',
    queryFn: async () => {
      const { obrasService } = await import('@/services/obras')
      const obras = await obrasService.getEnCurso()
      return obras
    }
  })
}

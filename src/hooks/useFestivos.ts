import { useState, useEffect } from 'react'
import { festivosService, DiaFestivo } from '@/services/festivos'

/**
 * Hook para manejar días festivos
 */
export function useFestivos(anio: number) {
  const [festivos, setFestivos] = useState<DiaFestivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      await festivosService.cargarFestivos(anio)
      const festivosAnio = festivosService.getFestivosAnio(anio)
      setFestivos(festivosAnio)
      setLoading(false)
    }

    cargar()
  }, [anio])

  const esFestivo = (fecha: string | Date): boolean => {
    return festivosService.esFestivo(fecha)
  }

  const getFestivo = (fecha: string | Date): DiaFestivo | null => {
    return festivosService.getFestivo(fecha)
  }

  return {
    festivos,
    loading,
    esFestivo,
    getFestivo
  }
}

/**
 * Servicio de Días Festivos
 * Maneja la carga y consulta de festivos chilenos
 */

import { supabase } from '@/lib/supabase'

export interface DiaFestivo {
  id: number
  fecha: string // YYYY-MM-DD
  nombre: string
  es_inamovible: boolean
  activo: boolean
}

class FestivosService {
  private festivos: Map<string, DiaFestivo> = new Map()
  private cargado = false

  /**
   * Cargar festivos desde la base de datos
   */
  async cargarFestivos(anio?: number): Promise<void> {
    try {
      let query = supabase
        .from('dias_festivos')
        .select('*')
        .eq('activo', true)

      // Si se especifica un año, filtrar por ese año
      if (anio) {
        const inicioAnio = `${anio}-01-01`
        const finAnio = `${anio}-12-31`
        query = query.gte('fecha', inicioAnio).lte('fecha', finAnio)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error al cargar festivos:', error)
        return
      }

      if (data) {
        this.festivos.clear()
        data.forEach(festivo => {
          this.festivos.set(festivo.fecha, festivo)
        })
        this.cargado = true
      }
    } catch (error) {
      console.error('Error al cargar festivos:', error)
    }
  }

  /**
   * Verificar si una fecha es festivo
   */
  esFestivo(fecha: string | Date): boolean {
    const fechaStr = typeof fecha === 'string'
      ? fecha
      : `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`

    return this.festivos.has(fechaStr)
  }

  /**
   * Obtener información del festivo
   */
  getFestivo(fecha: string | Date): DiaFestivo | null {
    const fechaStr = typeof fecha === 'string'
      ? fecha
      : `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`

    return this.festivos.get(fechaStr) || null
  }

  /**
   * Obtener todos los festivos del año
   */
  getFestivosAnio(anio: number): DiaFestivo[] {
    return Array.from(this.festivos.values())
      .filter(f => f.fecha.startsWith(anio.toString()))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  }

  /**
   * Verificar si ya se cargaron los festivos
   */
  estaCargado(): boolean {
    return this.cargado
  }

  /**
   * Limpiar caché
   */
  limpiarCache(): void {
    this.festivos.clear()
    this.cargado = false
  }
}

// Singleton
export const festivosService = new FestivosService()

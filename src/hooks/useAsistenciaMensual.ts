import { useState, useEffect, useCallback } from 'react'
import { asistenciaService, EstadoAsistencia, CreateAsistenciaDTO } from '@/services/asistencia'
import { supabase } from '@/lib/supabase'
import { useUndoRedo, HistoryAction } from './useUndoRedo'

interface TrabajadorMensual {
  id: number
  nombre: string
  rut: string
  cargo: string
  foto?: string
  bono_mensual?: number
}

interface RegistroDia {
  id?: number
  estado: EstadoAsistencia | null
  horas_extras: number
  observaciones?: string
}

export interface AsistenciaMensual {
  trabajador: TrabajadorMensual
  dias: Map<number, RegistroDia> // key = día del mes (1-31)
  totales: {
    OK: number
    F: number
    J: number
    A: number
    L: number
    BT: number
    BTR: number
    R: number
    HE_50: number
    HE_100: number
  }
}

export function useAsistenciaMensual(obraId: number, mes: number, anio: number) {
  const [asistencias, setAsistencias] = useState<AsistenciaMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [celdasModificadas, setCeldasModificadas] = useState<Set<string>>(new Set())

  // Sistema de deshacer/rehacer
  const undoRedo = useUndoRedo()

  // Cargar trabajadores y asistencia del mes
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)

      // Cargar trabajadores asignados a la obra
      console.log('Cargando trabajadores para obra:', obraId)

      const { data: asignaciones, error: errorAsignaciones } = await supabase
        .from('trabajadores_obras')
        .select(`
          trabajador_id,
          trabajadores!inner (
            id,
            nombre,
            rut,
            cargo,
            foto
          )
        `)
        .eq('obra_id', obraId)
        .eq('activo', true)

      console.log('Query resultado:', { asignaciones, error: errorAsignaciones })

      if (errorAsignaciones) {
        console.error('Error al cargar asignaciones:', {
          message: errorAsignaciones.message,
          details: errorAsignaciones.details,
          hint: errorAsignaciones.hint,
          code: errorAsignaciones.code
        })
        throw new Error(`Error al cargar trabajadores: ${errorAsignaciones.message || 'Error desconocido'}`)
      }

      console.log('Asignaciones cargadas:', asignaciones)

      if (!asignaciones || asignaciones.length === 0) {
        console.log('No hay asignaciones para esta obra')
        setAsistencias([])
        setLoading(false)
        return
      }

      // Cargar registros de asistencia del mes
      const registros = await asistenciaService.getByObraYMes(obraId, mes, anio)

      // Construir estructura de datos
      const asistenciasPorTrabajador = new Map<number, Map<number, RegistroDia>>()

      registros.forEach(reg => {
        // Extraer día directamente del string YYYY-MM-DD sin conversión UTC
        const dia = parseInt(reg.fecha.split('-')[2], 10)
        if (!asistenciasPorTrabajador.has(reg.trabajador_id)) {
          asistenciasPorTrabajador.set(reg.trabajador_id, new Map())
        }
        asistenciasPorTrabajador.get(reg.trabajador_id)!.set(dia, {
          id: reg.id,
          estado: reg.estado,
          horas_extras: (reg.horas_extras_50 || 0) + (reg.horas_extras_100 || 0),
          observaciones: reg.observaciones
        })
      })

      // Cargar bonos mensuales (puede que la tabla no exista aún)
      let bonosPorTrabajador = new Map()
      try {
        const { data: bonos, error: errorBonos } = await supabase
          .from('bonos_mensuales')
          .select('trabajador_id, monto')
          .eq('obra_id', obraId)
          .eq('mes', mes)
          .eq('anio', anio)

        if (!errorBonos && bonos) {
          bonosPorTrabajador = new Map(
            bonos.map(b => [b.trabajador_id, b.monto])
          )
        } else if (errorBonos) {
          console.warn('Tabla bonos_mensuales no existe o error:', errorBonos)
        }
      } catch (error) {
        console.warn('Error al cargar bonos (ignorando):', error)
      }

      // Construir array final
      const resultado: AsistenciaMensual[] = asignaciones
        .map(asig => {
          // Supabase puede devolver trabajadores como objeto o array
          const trabajador = (Array.isArray(asig.trabajadores)
            ? asig.trabajadores[0]
            : asig.trabajadores) as any

          if (!trabajador) {
            console.error('Trabajador no encontrado para asignación:', asig)
            return null
          }

          const diasTrabajador = asistenciasPorTrabajador.get(trabajador.id) || new Map()

          // Calcular totales
          const totales = {
            OK: 0, F: 0, J: 0, A: 0, L: 0, BT: 0, BTR: 0, R: 0,
            HE_50: 0, HE_100: 0
          }

          diasTrabajador.forEach((reg, dia) => {
            if (reg.estado && reg.estado in totales) {
              totales[reg.estado as keyof typeof totales]++
            }

            // Calcular tipo de HE según el día
            const fecha = new Date(anio, mes - 1, dia)
            const esDomingo = fecha.getDay() === 0

            if (reg.horas_extras > 0) {
              if (esDomingo) {
                totales.HE_100 += reg.horas_extras
              } else {
                totales.HE_50 += reg.horas_extras
              }
            }
          })

          return {
            trabajador: {
              ...trabajador,
              bono_mensual: bonosPorTrabajador.get(trabajador.id)
            },
            dias: diasTrabajador,
            totales
          }
        })
        .filter((item): item is AsistenciaMensual => item !== null)

      console.log('Resultado final:', resultado)
      setAsistencias(resultado)
    } catch (error) {
      console.error('Error al cargar asistencia mensual:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [obraId, mes, anio])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Actualizar celda individual
  const actualizarCelda = useCallback((
    trabajadorId: number,
    dia: number,
    estado: EstadoAsistencia | null,
    horasExtras: number = 0,
    observaciones?: string
  ) => {
    // Guardar estado anterior para undo
    const trabajador = asistencias.find(a => a.trabajador.id === trabajadorId)
    if (trabajador) {
      const registroAnterior = trabajador.dias.get(dia)
      const action: HistoryAction = {
        type: 'celda',
        timestamp: Date.now(),
        data: {
          trabajadorId,
          dia,
          estadoAnterior: registroAnterior?.estado || null,
          estadoNuevo: estado,
          horasAnterior: registroAnterior?.horas_extras || 0,
          horasNuevas: horasExtras,
          observacionesAnterior: registroAnterior?.observaciones,
          observacionesNuevas: observaciones
        }
      }
      undoRedo.addAction(action)
    }

    setAsistencias(prev => prev.map(item => {
      if (item.trabajador.id === trabajadorId) {
        const nuevosDias = new Map(item.dias)
        nuevosDias.set(dia, {
          id: item.dias.get(dia)?.id,
          estado,
          horas_extras: horasExtras,
          observaciones
        })

        // Recalcular totales
        const totales = {
          OK: 0, F: 0, J: 0, A: 0, L: 0, BT: 0, BTR: 0, R: 0,
          HE_50: 0, HE_100: 0
        }

        nuevosDias.forEach((reg, d) => {
          if (reg.estado) {
            totales[reg.estado]++
          }

          if (reg.horas_extras > 0) {
            const fecha = new Date(anio, mes - 1, d)
            const esDomingo = fecha.getDay() === 0

            if (esDomingo) {
              totales.HE_100 += reg.horas_extras
            } else {
              totales.HE_50 += reg.horas_extras
            }
          }
        })

        return {
          ...item,
          dias: nuevosDias,
          totales
        }
      }
      return item
    }))

    // Marcar celda como modificada
    setCeldasModificadas(prev => new Set(prev).add(`${trabajadorId}-${dia}`))
  }, [mes, anio, asistencias, undoRedo])

  // Deshacer último cambio
  const deshacer = useCallback(() => {
    const action = undoRedo.undo()
    if (!action) return

    if (action.type === 'celda') {
      const { trabajadorId, dia, estadoAnterior, horasAnterior, observacionesAnterior } = action.data
      if (trabajadorId && dia) {
        // Aplicar el cambio sin agregar al historial
        setAsistencias(prev => prev.map(item => {
          if (item.trabajador.id === trabajadorId) {
            const nuevosDias = new Map(item.dias)
            nuevosDias.set(dia, {
              id: item.dias.get(dia)?.id,
              estado: estadoAnterior,
              horas_extras: horasAnterior,
              observaciones: observacionesAnterior
            })

            // Recalcular totales
            const totales = { OK: 0, F: 0, J: 0, A: 0, L: 0, BT: 0, BTR: 0, R: 0, HE_50: 0, HE_100: 0 }
            nuevosDias.forEach((reg, d) => {
              if (reg.estado) totales[reg.estado]++
              if (reg.horas_extras > 0) {
                const fecha = new Date(anio, mes - 1, d)
                const esDomingo = fecha.getDay() === 0
                if (esDomingo) {
                  totales.HE_100 += reg.horas_extras
                } else {
                  totales.HE_50 += reg.horas_extras
                }
              }
            })

            return { ...item, dias: nuevosDias, totales }
          }
          return item
        }))
      }
    }
  }, [undoRedo, anio, mes])

  // Rehacer último cambio deshecho
  const rehacer = useCallback(() => {
    const action = undoRedo.redo()
    if (!action) return

    if (action.type === 'celda') {
      const { trabajadorId, dia, estadoNuevo, horasNuevas, observacionesNuevas } = action.data
      if (trabajadorId && dia) {
        setAsistencias(prev => prev.map(item => {
          if (item.trabajador.id === trabajadorId) {
            const nuevosDias = new Map(item.dias)
            nuevosDias.set(dia, {
              id: item.dias.get(dia)?.id,
              estado: estadoNuevo,
              horas_extras: horasNuevas,
              observaciones: observacionesNuevas
            })

            const totales = { OK: 0, F: 0, J: 0, A: 0, L: 0, BT: 0, BTR: 0, R: 0, HE_50: 0, HE_100: 0 }
            nuevosDias.forEach((reg, d) => {
              if (reg.estado) totales[reg.estado]++
              if (reg.horas_extras > 0) {
                const fecha = new Date(anio, mes - 1, d)
                const esDomingo = fecha.getDay() === 0
                if (esDomingo) {
                  totales.HE_100 += reg.horas_extras
                } else {
                  totales.HE_50 += reg.horas_extras
                }
              }
            })

            return { ...item, dias: nuevosDias, totales }
          }
          return item
        }))
      }
    }
  }, [undoRedo, anio, mes])

  // Copiar estado a rango de días
  const copiarEstadoRango = useCallback((
    trabajadorId: number,
    diaInicio: number,
    diaFin: number,
    estado: EstadoAsistencia | null,
    horasExtras: number = 0
  ) => {
    for (let dia = diaInicio; dia <= diaFin; dia++) {
      actualizarCelda(trabajadorId, dia, estado, horasExtras)
    }
  }, [actualizarCelda])

  // Guardar cambios
  const guardarCambios = useCallback(async () => {
    try {
      setGuardando(true)

      let exitosos = 0
      let errores: any[] = []

      // Guardar cada celda modificada individualmente
      for (const item of asistencias) {
        for (const [dia, reg] of item.dias) {
          const celdaKey = `${item.trabajador.id}-${dia}`

          if (celdasModificadas.has(celdaKey)) {
            // Solo guardar si hay un estado válido
            if (!reg.estado) {
              console.warn('Saltando celda sin estado:', { trabajadorId: item.trabajador.id, dia })
              continue
            }

            try {
              // Construir fecha sin conversión UTC para evitar desfase de timezone
              const fechaStr = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`

              // Calcular tipo de HE (crear Date solo para calcular día de semana)
              const fecha = new Date(anio, mes - 1, dia)
              const esDomingo = fecha.getDay() === 0

              const datos: CreateAsistenciaDTO = {
                trabajador_id: item.trabajador.id,
                obra_id: obraId,
                fecha: fechaStr,
                estado: reg.estado,
                horas_extras_50: esDomingo ? 0 : (reg.horas_extras || 0),
                horas_extras_100: esDomingo ? (reg.horas_extras || 0) : 0,
                observaciones: reg.observaciones || undefined
              }

              // Upsert: insertar o actualizar
              await asistenciaService.upsert(datos)

              exitosos++
            } catch (error) {
              console.error('Error guardando celda:', error)
              errores.push({ trabajadorId: item.trabajador.id, dia, error })
            }
          }
        }
      }

      setCeldasModificadas(new Set())

      // Recargar datos para reflejar cambios
      await cargarDatos()

      // Limpiar historial de undo/redo después de guardar exitosamente
      undoRedo.clear()

      return { exitosos, errores }
    } catch (error) {
      console.error('Error al guardar:', error)
      throw error
    } finally {
      setGuardando(false)
    }
  }, [asistencias, celdasModificadas, obraId, mes, anio, cargarDatos])

  // Actualizar bono mensual
  const actualizarBono = useCallback(async (trabajadorId: number, monto: number) => {
    try {
      const { error } = await supabase
        .from('bonos_mensuales')
        .upsert({
          trabajador_id: trabajadorId,
          obra_id: obraId,
          mes,
          anio,
          monto
        }, {
          onConflict: 'trabajador_id,obra_id,mes,anio'
        })

      if (error) throw error

      // Actualizar estado local
      setAsistencias(prev => prev.map(item => {
        if (item.trabajador.id === trabajadorId) {
          return {
            ...item,
            trabajador: {
              ...item.trabajador,
              bono_mensual: monto
            }
          }
        }
        return item
      }))
    } catch (error) {
      console.error('Error al actualizar bono:', error)
      throw error
    }
  }, [obraId, mes, anio])

  return {
    asistencias,
    loading,
    guardando,
    celdasModificadas: celdasModificadas.size,
    actualizarCelda,
    copiarEstadoRango,
    guardarCambios,
    actualizarBono,
    recargar: cargarDatos,
    // Undo/Redo
    deshacer,
    rehacer,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo
  }
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, Download, Save, Users, Clock, TrendingUp, CalendarDays, FileSpreadsheet } from "lucide-react"
import AsistenciaMensualView from "./AsistenciaMensualView"
import { asistenciaService, asistenciaUtils, EstadoAsistencia, CreateAsistenciaDTO } from "@/services/asistencia"
import { descargarAsistenciaExcel } from "@/services/excel-asistencia"
import { useToast } from "@/components/ui/toast"

interface AsistenciaObraTabProps {
  obraId: number
  nombreObra: string
}

interface TrabajadorAsistencia {
  id: number
  nombre: string
  rut: string
  cargo: string
  foto?: string
  asistencia: {
    id?: number
    estado: EstadoAsistencia
    horas_extras_50?: number
    horas_extras_100?: number
    observaciones?: string
  } | null
}

export default function AsistenciaObraTab({ obraId, nombreObra }: AsistenciaObraTabProps) {
  const { addToast } = useToast()
  const [vista, setVista] = useState<'diaria' | 'mensual'>('diaria')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [trabajadores, setTrabajadores] = useState<TrabajadorAsistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [dialogExportar, setDialogExportar] = useState(false)
  const [mesExportar, setMesExportar] = useState(new Date().getMonth() + 1)
  const [anioExportar, setAnioExportar] = useState(new Date().getFullYear())
  const [estadisticas, setEstadisticas] = useState<any>(null)

  // Cargar datos cuando cambia la fecha
  useEffect(() => {
    cargarAsistencia()
  }, [obraId, fechaSeleccionada])

  // Cargar estadísticas del mes
  useEffect(() => {
    cargarEstadisticas()
  }, [obraId, fechaSeleccionada])

  const cargarAsistencia = async () => {
    try {
      setLoading(true)
      const fechaStr = asistenciaUtils.formatFechaLocal(fechaSeleccionada)
      const data = await asistenciaService.getTrabajadoresConAsistencia(obraId, fechaStr)
      setTrabajadores(data)
    } catch (error) {
      console.error('Error al cargar asistencia:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo cargar la asistencia"
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const mes = fechaSeleccionada.getMonth() + 1
      const anio = fechaSeleccionada.getFullYear()
      const stats = await asistenciaService.getEstadisticas(mes, anio, obraId)
      setEstadisticas(stats)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada)
    nuevaFecha.setDate(nuevaFecha.getDate() + dias)
    setFechaSeleccionada(nuevaFecha)
  }

  const hoy = () => {
    setFechaSeleccionada(new Date())
  }

  const actualizarEstado = (trabajadorId: number, estado: EstadoAsistencia) => {
    setTrabajadores(trabajadores.map(t => {
      if (t.id === trabajadorId) {
        return {
          ...t,
          asistencia: {
            ...t.asistencia,
            estado,
            // Resetear horas extras si cambia a un estado que no es OK
            horas_extras_50: estado === 'OK' ? t.asistencia?.horas_extras_50 : 0,
            horas_extras_100: estado === 'OK' ? t.asistencia?.horas_extras_100 : 0
          } as any
        }
      }
      return t
    }))
  }

  const actualizarHorasExtras = (trabajadorId: number, tipo: '50' | '100', horas: number) => {
    setTrabajadores(trabajadores.map(t => {
      if (t.id === trabajadorId) {
        return {
          ...t,
          asistencia: {
            ...t.asistencia,
            estado: t.asistencia?.estado || 'OK',
            [`horas_extras_${tipo}`]: horas
          } as any
        }
      }
      return t
    }))
  }

  const actualizarObservaciones = (trabajadorId: number, observaciones: string) => {
    setTrabajadores(trabajadores.map(t => {
      if (t.id === trabajadorId) {
        return {
          ...t,
          asistencia: {
            ...t.asistencia,
            estado: t.asistencia?.estado || 'OK',
            observaciones
          } as any
        }
      }
      return t
    }))
  }

  const guardarAsistencia = async () => {
    try {
      setGuardando(true)
      const fechaStr = asistenciaUtils.formatFechaLocal(fechaSeleccionada)

      const registros = trabajadores
        .filter(t => t.asistencia?.estado) // Solo guardar si tiene un estado seleccionado
        .map(t => ({
          trabajador_id: t.id,
          estado: t.asistencia!.estado,
          horas_extras_50: t.asistencia?.horas_extras_50 || 0,
          horas_extras_100: t.asistencia?.horas_extras_100 || 0,
          observaciones: t.asistencia?.observaciones
        }))

      if (registros.length === 0) {
        addToast({
          type: "warning",
          title: "Sin cambios",
          description: "No hay registros para guardar"
        })
        return
      }

      const resultado = await asistenciaService.marcarMasiva({
        obra_id: obraId,
        fecha: fechaStr,
        registros
      })

      if (resultado.errores.length > 0) {
        addToast({
          type: "warning",
          title: "Guardado parcial",
          description: `${resultado.exitosos} guardados, ${resultado.errores.length} con errores`
        })
      } else {
        addToast({
          type: "success",
          title: "Guardado exitoso",
          description: `Se guardaron ${resultado.exitosos} registros`
        })
      }

      // Recargar datos
      await cargarAsistencia()
      await cargarEstadisticas()
    } catch (error) {
      console.error('Error al guardar:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo guardar la asistencia"
      })
    } finally {
      setGuardando(false)
    }
  }

  const marcarTodosOK = () => {
    setTrabajadores(trabajadores.map(t => ({
      ...t,
      asistencia: {
        ...t.asistencia,
        estado: 'OK' as EstadoAsistencia
      } as any
    })))
  }

  const exportarExcel = async () => {
    try {
      await descargarAsistenciaExcel(obraId, mesExportar, anioExportar, nombreObra)
      setDialogExportar(false)
      addToast({
        type: "success",
        title: "Exportado",
        description: "Archivo Excel descargado exitosamente"
      })
    } catch (error) {
      console.error('Error al exportar:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo exportar el archivo"
      })
    }
  }

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getColorEstado = (estado: EstadoAsistencia | '') => {
    const colores: Record<string, string> = {
      'OK': '#98FB98',    // Verde claro
      'F': '#FFB6C1',     // Rosado claro
      'J': '#B0E0E6',     // Celeste pálido
      'A': '#FFA07A',     // Salmón claro
      'L': '#FFFACD',     // Amarillo pálido
      'BT': '#E6B0AA',    // Rosado pastel
      'BTR': '#FAE5D3',   // Beige claro
      'R': '#D3D3D3'      // Gris claro
    }
    return colores[estado] || '#FFFFFF'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando asistencia...</p>
        </div>
      </div>
    )
  }

  // Si la vista es mensual, renderizar la vista mensual
  if (vista === 'mensual') {
    return (
      <div className="space-y-4">
        {/* Toggle de vistas */}
        <div className="px-6 pt-6">
          <Tabs value={vista} onValueChange={(v) => setVista(v as 'diaria' | 'mensual')}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="diaria" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vista Diaria
              </TabsTrigger>
              <TabsTrigger value="mensual" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Vista Mensual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <AsistenciaMensualView obraId={obraId} nombreObra={nombreObra} />
      </div>
    )
  }

  // Vista diaria (original)
  return (
    <div className="p-6 space-y-6">
      {/* Toggle de vistas */}
      <Tabs value={vista} onValueChange={(v) => setVista(v as 'diaria' | 'mensual')}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="diaria" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vista Diaria
          </TabsTrigger>
          <TabsTrigger value="mensual" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Vista Mensual
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Control de Asistencia</h2>
          <p className="text-gray-600">{nombreObra}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDialogExportar(true)}
            className="text-white font-semibold hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: '#217346' }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button
            onClick={guardarAsistencia}
            disabled={guardando}
            className="text-white"
            style={{ backgroundColor: '#0066cc' }}
          >
            <Save className="h-4 w-4 mr-2" />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Estadísticas del mes */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Registros</p>
                  <p className="text-3xl font-bold">{estadisticas.totalRegistros}</p>
                </div>
                <Users className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Promedio Asistencia</p>
                  <p className="text-3xl font-bold text-green-600">{estadisticas.promedioAsistencia}%</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">HE 50%</p>
                  <p className="text-3xl font-bold text-orange-600">{estadisticas.horas.totalHE50}h</p>
                </div>
                <Clock className="h-10 w-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">HE 100%</p>
                  <p className="text-3xl font-bold text-red-600">{estadisticas.horas.totalHE100}h</p>
                </div>
                <Clock className="h-10 w-10 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navegador de fecha */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => cambiarFecha(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center flex-1 mx-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-gray-500" />
                <p className="text-xl font-semibold">{formatearFecha(fechaSeleccionada)}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={hoy}>
                  Hoy
                </Button>
                {asistenciaUtils.esFinDeSemana(asistenciaUtils.formatFechaLocal(fechaSeleccionada)) && (
                  <Badge variant="secondary">Fin de Semana</Badge>
                )}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => cambiarFecha(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Acciones Rápidas:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={marcarTodosOK}>
                Marcar Todos OK
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda de estados */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-3">Leyenda de Estados:</p>
          <div className="flex flex-wrap gap-2">
            {(['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R'] as EstadoAsistencia[]).map(estado => (
              <div
                key={estado}
                className="flex items-center gap-2 px-3 py-1 rounded-md border"
                style={{ backgroundColor: getColorEstado(estado) + '40' }}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getColorEstado(estado) }}
                />
                <span className="text-xs font-medium">{asistenciaUtils.getEtiquetaEstado(estado)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de trabajadores */}
      <div className="space-y-3">
        {trabajadores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay trabajadores asignados a esta obra</p>
            </CardContent>
          </Card>
        ) : (
          trabajadores.map((trabajador) => (
            <Card key={trabajador.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Foto del trabajador */}
                  {trabajador.foto ? (
                    <img
                      src={trabajador.foto}
                      alt={trabajador.nombre}
                      className="h-16 w-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: '#0066cc' }}
                    >
                      {trabajador.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  )}

                  {/* Información del trabajador */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{trabajador.nombre}</h3>
                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                      <span>{trabajador.rut}</span>
                      <span>•</span>
                      <span>{trabajador.cargo}</span>
                    </div>

                    {/* Controles de asistencia */}
                    <div className="mt-4 space-y-3">
                      {/* Selector de estado */}
                      <div className="flex gap-2 flex-wrap">
                        {(['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R'] as EstadoAsistencia[]).map(estado => (
                          <button
                            key={estado}
                            onClick={() => actualizarEstado(trabajador.id, estado)}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                              trabajador.asistencia?.estado === estado
                                ? 'ring-2 ring-blue-500 shadow-md'
                                : 'hover:shadow-md'
                            }`}
                            style={{
                              backgroundColor: trabajador.asistencia?.estado === estado
                                ? getColorEstado(estado)
                                : getColorEstado(estado) + '40'
                            }}
                          >
                            {estado}
                          </button>
                        ))}
                      </div>

                      {/* Horas extras (solo si estado es OK) */}
                      {trabajador.asistencia?.estado === 'OK' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">HE 50%</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={trabajador.asistencia?.horas_extras_50 || ''}
                              onChange={(e) => actualizarHorasExtras(trabajador.id, '50', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">HE 100%</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={trabajador.asistencia?.horas_extras_100 || ''}
                              onChange={(e) => actualizarHorasExtras(trabajador.id, '100', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}

                      {/* Observaciones */}
                      <div>
                        <Label className="text-xs">Observaciones</Label>
                        <Textarea
                          value={trabajador.asistencia?.observaciones || ''}
                          onChange={(e) => actualizarObservaciones(trabajador.id, e.target.value)}
                          placeholder="Observaciones opcionales..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Exportar Excel */}
      <Dialog open={dialogExportar} onOpenChange={setDialogExportar}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Exportar Asistencia a Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mes</Label>
                <Select
                  value={mesExportar.toString()}
                  onValueChange={(v) => setMesExportar(parseInt(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                      <SelectItem key={mes} value={mes.toString()}>
                        {asistenciaUtils.getNombreMes(mes)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select
                  value={anioExportar.toString()}
                  onValueChange={(v) => setAnioExportar(parseInt(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(anio => (
                      <SelectItem key={anio} value={anio.toString()}>
                        {anio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Se exportará el archivo con el formato estándar de construcción chilena,
                incluyendo todos los estados y horas extras del mes seleccionado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogExportar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={exportarExcel}
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

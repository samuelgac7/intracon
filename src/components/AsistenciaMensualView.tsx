"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  MoreVertical,
  DollarSign,
  Loader2,
  Users,
  FileSpreadsheet,
  Search,
  Filter,
  X,
  Undo2,
  Redo2
} from 'lucide-react'
import { useAsistenciaMensual } from '@/hooks/useAsistenciaMensual'
import { useFestivos } from '@/hooks/useFestivos'
import { asistenciaUtils } from '@/services/asistencia'
import { descargarAsistenciaExcel } from '@/services/excel-asistencia'
import CeldaAsistencia from './CeldaAsistencia'
import MenuContextualColumna from './MenuContextualColumna'
import { useToast } from "@/components/ui/toast"
import { EstadoAsistencia } from '@/services/asistencia'

interface AsistenciaMensualViewProps {
  obraId: number
  nombreObra: string
}

export default function AsistenciaMensualView({ obraId, nombreObra }: AsistenciaMensualViewProps) {
  const { addToast } = useToast()
  const [fecha, setFecha] = useState(new Date())
  const mes = fecha.getMonth() + 1
  const anio = fecha.getFullYear()

  const {
    asistencias,
    loading,
    guardando,
    celdasModificadas,
    actualizarCelda,
    guardarCambios,
    actualizarBono,
    deshacer,
    rehacer,
    canUndo,
    canRedo
  } = useAsistenciaMensual(obraId, mes, anio)

  // Cargar festivos
  const { festivos, esFestivo: esFestivoFn, getFestivo } = useFestivos(anio)

  const [dialogBono, setDialogBono] = useState(false)
  const [trabajadorBono, setTrabajadorBono] = useState<number | null>(null)
  const [montoBono, setMontoBono] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null)

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroCargo, setFiltroCargo] = useState<string>('todos')
  const [soloConCambios, setSoloConCambios] = useState(false)

  // Estado para menú contextual de columna
  const [menuColumna, setMenuColumna] = useState<{ dia: number; x: number; y: number } | null>(null)

  // Obtener cargos únicos para el filtro
  const cargosUnicos = Array.from(new Set(asistencias.map(a => a.trabajador.cargo)))

  // Aplicar filtros
  const asistenciasFiltradas = asistencias.filter(item => {
    // Filtro de búsqueda (nombre o RUT)
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      const coincideNombre = item.trabajador.nombre.toLowerCase().includes(busquedaLower)
      const coincideRut = item.trabajador.rut.toLowerCase().includes(busquedaLower)
      if (!coincideNombre && !coincideRut) return false
    }

    // Filtro de cargo
    if (filtroCargo !== 'todos' && item.trabajador.cargo !== filtroCargo) {
      return false
    }

    // Filtro de solo cambios sin guardar
    if (soloConCambios) {
      const tieneCambios = Array.from(item.dias.keys()).some(dia => {
        const celdaKey = `${item.trabajador.id}-${dia}`
        return celdasModificadas.has(celdaKey)
      })
      if (!tieneCambios) return false
    }

    return true
  })

  // Cambiar mes
  const cambiarMes = (delta: number) => {
    const nuevaFecha = new Date(fecha)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + delta)
    setFecha(nuevaFecha)
  }

  // Guardar
  const handleGuardar = async () => {
    try {
      const resultado = await guardarCambios()
      addToast({
        type: "success",
        title: "Guardado exitoso",
        description: `Se guardaron ${resultado.exitosos} registros`
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo guardar la asistencia"
      })
    }
  }

  // Abrir diálogo de bono
  const abrirDialogoBono = (trabajadorId: number, bonoActual?: number) => {
    setTrabajadorBono(trabajadorId)
    setMontoBono(bonoActual || 0)
    setDialogBono(true)
    setMenuAbierto(null)
  }

  // Guardar bono
  const handleGuardarBono = async () => {
    if (trabajadorBono) {
      try {
        await actualizarBono(trabajadorBono, montoBono)
        addToast({
          type: "success",
          title: "Bono actualizado",
          description: "El bono mensual fue guardado correctamente"
        })
        setDialogBono(false)
      } catch (error) {
        addToast({
          type: "error",
          title: "Error",
          description: "No se pudo guardar el bono"
        })
      }
    }
  }

  // Exportar a Excel
  const exportarExcel = async () => {
    try {
      await descargarAsistenciaExcel(obraId, mes, anio, nombreObra)
      addToast({
        type: "success",
        title: "Excel exportado",
        description: "El archivo se descargó correctamente"
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

  // Marcar toda una columna (día completo)
  const marcarColumnaCompleta = (dia: number, estado: EstadoAsistencia) => {
    let marcados = 0
    asistenciasFiltradas.forEach(item => {
      actualizarCelda(item.trabajador.id, dia, estado, 0)
      marcados++
    })

    addToast({
      type: "success",
      title: "Día marcado",
      description: `${marcados} trabajadores marcados como ${estado} el día ${dia}`
    })
  }

  // Manejar click derecho en header de día
  const handleContextMenu = (e: React.MouseEvent, dia: number) => {
    e.preventDefault()
    setMenuColumna({
      dia,
      x: e.clientX,
      y: e.clientY
    })
  }

  // Verificar si es feriado
  const esFeriado = (dia: number): boolean => {
    const fechaStr = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`
    return esFestivoFn(fechaStr)
  }

  // Verificar si es fin de semana
  const esFinDeSemana = (dia: number): boolean => {
    const fecha = new Date(anio, mes - 1, dia)
    const diaSemana = fecha.getDay()
    return diaSemana === 0 || diaSemana === 6
  }

  // Obtener días del mes
  const diasEnMes = new Date(anio, mes, 0).getDate()
  const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1)

  // Nombre del mes
  const nombreMes = asistenciaUtils.getNombreMes(mes)

  // Helper: Calcular completitud (días marcados vs días totales)
  const calcularCompletitud = (diasMap: Map<number, any>) => {
    let diasMarcados = 0
    let diasNoMarcados: number[] = []

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const reg = diasMap.get(dia)
      if (reg && reg.estado) {
        diasMarcados++
      } else {
        // Solo contar como no marcados los días que ya pasaron
        const fecha = new Date(anio, mes - 1, dia)
        if (fecha <= new Date()) {
          diasNoMarcados.push(dia)
        }
      }
    }

    return { diasMarcados, diasNoMarcados, porcentaje: Math.round((diasMarcados / diasEnMes) * 100) }
  }

  // Helper: Detectar faltas consecutivas
  const tieneFaltasConsecutivas = (diasMap: Map<number, any>, minConsecutivas = 3) => {
    let consecutivas = 0
    let maxConsecutivas = 0

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const reg = diasMap.get(dia)
      if (reg && reg.estado === 'F') {
        consecutivas++
        maxConsecutivas = Math.max(maxConsecutivas, consecutivas)
      } else {
        consecutivas = 0
      }
    }

    return maxConsecutivas >= minConsecutivas
  }

  // Helper: Días sin marcar cerca de fin de mes (últimos 5 días)
  const tieneDiasSinMarcarRecientes = (diasMap: Map<number, any>) => {
    const hoy = new Date()
    const diaActual = hoy.getDate()
    const mesActual = hoy.getMonth() + 1
    const anioActual = hoy.getFullYear()

    // Solo si estamos en el mes actual
    if (mes !== mesActual || anio !== anioActual) return false

    // Verificar últimos 5 días que ya pasaron
    let diasSinMarcar = 0
    for (let i = Math.max(1, diaActual - 5); i < diaActual; i++) {
      const reg = diasMap.get(i)
      if (!reg || !reg.estado) {
        diasSinMarcar++
      }
    }

    return diasSinMarcar >= 2
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando vista mensual...</p>
          <p className="text-xs text-gray-500 mt-2">Obra ID: {obraId} | Mes: {mes}/{anio}</p>
        </div>
      </div>
    )
  }

  // Mensaje de debugging si no hay trabajadores
  if (asistencias.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay trabajadores en esta obra</h3>
            <p className="text-gray-600 mb-4">
              No se encontraron trabajadores asignados a esta obra para {nombreMes} {anio}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-semibold mb-2">
                Posibles causas:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>No hay trabajadores asignados en la pestaña "Trabajadores"</li>
                <li>Los trabajadores están marcados como inactivos</li>
                <li>Error al cargar datos (revisa la consola del navegador)</li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                💡 Presiona F12 y ve a "Console" para ver detalles técnicos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vista Mensual - {nombreObra}</h2>
          <p className="text-gray-600">Gestión rápida de asistencia por mes</p>
        </div>
        <div className="flex items-center gap-3">
          {celdasModificadas > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {celdasModificadas} cambios sin guardar
            </Badge>
          )}
          {/* Botones Deshacer/Rehacer */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={deshacer}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              className="px-2"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rehacer}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Y)"
              className="px-2"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={exportarExcel}
            className="text-white font-semibold hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: '#217346' }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={guardando || celdasModificadas === 0}
            className="text-white"
            style={{ backgroundColor: '#0066cc' }}
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Navegador de mes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => cambiarMes(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="text-xl font-semibold">
              {nombreMes} {anio}
            </h3>

            <Button variant="outline" size="sm" onClick={() => cambiarMes(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[250px]">
              <Label className="text-xs mb-1 block">Buscar Trabajador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre o RUT..."
                  className="pl-10 pr-10"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtro por cargo */}
            <div className="w-48">
              <Label className="text-xs mb-1 block">Cargo</Label>
              <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cargos</SelectItem>
                  {cargosUnicos.map(cargo => (
                    <SelectItem key={cargo} value={cargo}>
                      {cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro solo cambios */}
            <div className="flex items-center">
              <Button
                variant={soloConCambios ? "default" : "outline"}
                size="sm"
                onClick={() => setSoloConCambios(!soloConCambios)}
                className={soloConCambios ? "bg-orange-600 text-white hover:bg-orange-700" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Solo con cambios
              </Button>
            </div>

            {/* Contador de resultados */}
            <div className="ml-auto">
              <Badge variant="secondary" className="text-xs">
                {asistenciasFiltradas.length} de {asistencias.length} trabajadores
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de asistencia */}
      <div className="border rounded-lg bg-white overflow-x-auto shadow-sm">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Cabeceras */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {/* Columna trabajador */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-blue-50 sticky left-0 z-20 border-r-2">
                  Trabajador
                </th>

                {/* Días del mes */}
                {dias.map(dia => {
                  const fecha = new Date(anio, mes - 1, dia)
                  const diaSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][fecha.getDay()]
                  const esFS = esFinDeSemana(dia)
                  const esF = esFeriado(dia)
                  const fechaStr = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`
                  const festivo = getFestivo(fechaStr)

                  return (
                    <th
                      key={dia}
                      className={`px-1 py-2 text-center text-xs font-bold cursor-context-menu hover:bg-opacity-80 transition-colors ${
                        esF ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' :
                        esFS ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                      }`}
                      style={{ width: '48px' }}
                      title={esF && festivo ? `${festivo.nombre}\n\nClick derecho para marcar todos` : 'Click derecho para marcar todos'}
                      onContextMenu={(e) => handleContextMenu(e, dia)}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        {esF && <span className="text-[12px]">🎉</span>}
                        <span>{dia}</span>
                      </div>
                      <div className="text-[10px] font-normal">{diaSemana}</div>
                    </th>
                  )
                })}

                {/* Columnas de totales */}
                {['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R'].map(estado => (
                  <th
                    key={estado}
                    className="px-2 py-3 text-center text-xs font-bold text-white"
                    style={{
                      backgroundColor: asistenciaUtils.getColorEstado(estado as any),
                      color: '#000',
                      minWidth: '45px'
                    }}
                  >
                    {estado}
                  </th>
                ))}

                <th className="px-2 py-3 text-center text-xs font-bold bg-orange-100 text-orange-800" style={{ minWidth: '50px' }}>
                  HE<br/>50%
                </th>
                <th className="px-2 py-3 text-center text-xs font-bold bg-purple-100 text-purple-800" style={{ minWidth: '50px' }}>
                  HE<br/>100%
                </th>
                <th className="px-2 py-3 text-center text-xs font-bold bg-green-100 text-green-800" style={{ minWidth: '60px' }}>
                  BONO
                </th>
                <th className="px-2 py-3 text-center bg-gray-50" style={{ width: '40px' }}>
                  {/* Menú */}
                </th>
              </tr>
            </thead>

            {/* Filas de trabajadores */}
            <tbody className="bg-white divide-y divide-gray-200">
              {asistencias.length === 0 ? (
                <tr>
                  <td colSpan={dias.length + 13} className="px-6 py-12 text-center text-gray-500">
                    No hay trabajadores asignados a esta obra
                  </td>
                </tr>
              ) : (
                asistenciasFiltradas.map(item => {
                  const completitud = calcularCompletitud(item.dias)
                  const tieneAlertaFaltas = tieneFaltasConsecutivas(item.dias)
                  const tieneAlertaDiasSinMarcar = tieneDiasSinMarcarRecientes(item.dias)

                  return (
                    <tr
                      key={item.trabajador.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        tieneAlertaFaltas ? 'border-l-4 border-l-red-500' : ''
                      } ${tieneAlertaDiasSinMarcar && !tieneAlertaFaltas ? 'border-l-4 border-l-amber-400' : ''}`}
                    >
                      {/* Info trabajador */}
                      <td className="px-4 py-2 whitespace-nowrap bg-blue-50 sticky left-0 z-10 border-r-2">
                        <div className="flex items-center gap-2">
                          {item.trabajador.foto ? (
                            <img
                              src={item.trabajador.foto}
                              alt={item.trabajador.nombre}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: '#0066cc' }}
                            >
                              {item.trabajador.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-[180px]">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {item.trabajador.nombre}
                              {/* Indicador de completitud */}
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 ${
                                  completitud.porcentaje >= 90
                                    ? 'bg-green-100 text-green-800'
                                    : completitud.porcentaje >= 70
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {completitud.diasMarcados}/{diasEnMes}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              {item.trabajador.cargo}
                              {/* Alertas visuales */}
                              {tieneAlertaFaltas && (
                                <span className="text-red-600 font-semibold" title="3+ faltas consecutivas">
                                  ⚠️
                                </span>
                              )}
                              {tieneAlertaDiasSinMarcar && !tieneAlertaFaltas && (
                                <span className="text-amber-600" title="Días recientes sin marcar">
                                  ⏰
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                    {/* Celdas de días */}
                    {dias.map(dia => {
                      const registro = item.dias.get(dia)
                      return (
                        <td key={dia} className="p-0">
                          <CeldaAsistencia
                            trabajadorId={item.trabajador.id}
                            trabajadorNombre={item.trabajador.nombre}
                            dia={dia}
                            mes={mes}
                            anio={anio}
                            estado={registro?.estado || null}
                            horasExtras={registro?.horas_extras || 0}
                            observaciones={registro?.observaciones}
                            esFinDeSemana={esFinDeSemana(dia)}
                            esFeriado={esFeriado(dia)}
                            onActualizar={(estado, horas, obs) =>
                              actualizarCelda(item.trabajador.id, dia, estado, horas, obs)
                            }
                          />
                        </td>
                      )
                    })}

                    {/* Totales */}
                    {(['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R'] as const).map(estado => (
                      <td key={estado} className="px-2 py-2 text-center text-sm font-bold">
                        {item.totales[estado] || '-'}
                      </td>
                    ))}

                    <td className="px-2 py-2 text-center text-sm font-bold text-orange-600">
                      {item.totales.HE_50 || '-'}
                    </td>
                    <td className="px-2 py-2 text-center text-sm font-bold text-purple-600">
                      {item.totales.HE_100 || '-'}
                    </td>

                    {/* Bono */}
                    <td className="px-2 py-2 text-center text-sm font-bold text-green-700">
                      {item.trabajador.bono_mensual ? (
                        <span>${item.trabajador.bono_mensual.toLocaleString()}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Menú */}
                    <td className="px-2 py-2 text-center relative">
                      <button
                        onClick={() => setMenuAbierto(menuAbierto === item.trabajador.id ? null : item.trabajador.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>

                      {/* Menú desplegable */}
                      {menuAbierto === item.trabajador.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border z-30 py-1">
                          <button
                            onClick={() => abrirDialogoBono(item.trabajador.id, item.trabajador.bono_mensual)}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <DollarSign className="h-4 w-4" />
                            Asignar Bono Mensual
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-3">Leyenda:</p>
          <div className="flex flex-wrap gap-2">
            {(['OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R'] as const).map(estado => (
              <div
                key={estado}
                className="flex items-center gap-2 px-3 py-1 rounded-md"
                style={{ backgroundColor: asistenciaUtils.getColorEstado(estado) + '80' }}
              >
                <div
                  className="w-4 h-4 rounded font-bold text-xs flex items-center justify-center"
                  style={{ backgroundColor: asistenciaUtils.getColorEstado(estado) }}
                >
                  {estado}
                </div>
                <span className="text-xs font-medium">{asistenciaUtils.getEtiquetaEstado(estado)}</span>
              </div>
            ))}

            {/* Horas Extras */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-md"
              style={{ backgroundColor: '#FAB4B4' + '80' }}
            >
              <div
                className="w-4 h-4 rounded font-bold text-xs flex items-center justify-center"
                style={{ backgroundColor: '#FAB4B4' }}
              >
                #
              </div>
              <span className="text-xs font-medium">HE 50%</span>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1 rounded-md"
              style={{ backgroundColor: '#D8BFD8' + '80' }}
            >
              <div
                className="w-4 h-4 rounded font-bold text-xs flex items-center justify-center"
                style={{ backgroundColor: '#D8BFD8' }}
              >
                #
              </div>
              <span className="text-xs font-medium">HE 100%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            <kbd className="px-2 py-1 bg-gray-100 rounded">Click</kbd> en cualquier celda para editar.
            Las celdas con borde punteado son fines de semana.
            Los números en las celdas indican horas extras trabajadas.
          </p>
        </CardContent>
      </Card>

      {/* Dialog Bono */}
      <Dialog open={dialogBono} onOpenChange={setDialogBono}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Asignar Bono Mensual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mes</Label>
              <Input value={`${nombreMes} ${anio}`} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Monto del Bono ($)</Label>
              <Input
                type="number"
                min="0"
                value={montoBono || ''}
                onChange={(e) => setMontoBono(parseFloat(e.target.value) || 0)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
              Este bono se asignará al trabajador para el mes de {nombreMes} {anio} y aparecerá en su liquidación.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBono(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarBono}
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Guardar Bono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menú contextual para marcar columna completa */}
      {menuColumna && (
        <MenuContextualColumna
          position={{ x: menuColumna.x, y: menuColumna.y }}
          dia={menuColumna.dia}
          onMarcarTodos={(estado) => marcarColumnaCompleta(menuColumna.dia, estado)}
          onClose={() => setMenuColumna(null)}
        />
      )}
    </div>
  )
}

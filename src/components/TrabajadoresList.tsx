"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Users as UsersIcon, TrendingUp, Clock, AlertCircle, Eye, UserX, Building2, ChevronDown, ChevronRight } from "lucide-react"
import { trabajadoresService } from "@/services/trabajadores"
import type { Trabajador, Obra } from "@/lib/supabase"
import { useDataRefreshListener } from "@/hooks/useDataRefresh"
import { useAuth } from "@/hooks/useAuth"

interface TrabajadoresListProps {
  selectedId?: number | null
  compact?: boolean
  onTrabajadorClick?: (id: number) => void
  onSelectionChange?: (id: number | null) => void
  onNuevoTrabajador?: () => void
}

export default function TrabajadoresList({
  selectedId,
  compact = false,
  onTrabajadorClick,
  onSelectionChange,
  onNuevoTrabajador
}: TrabajadoresListProps) {
  const router = useRouter()
  const { usuario } = useAuth()
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [trabajadoresObras, setTrabajadoresObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroCargo, setFiltroCargo] = useState<string>("todos")
  const [vistaAgrupada, setVistaAgrupada] = useState(true)
  const [obrasExpandidas, setObrasExpandidas] = useState<Set<number>>(new Set())

  const cargarTrabajadores = useCallback(async (esRefresh = false) => {
    try {
      // Solo mostrar loading en la carga inicial, no en refresh
      if (!esRefresh) {
        setLoading(true)
      }

      const { supabase } = await import('@/lib/supabase')
      const { obrasService } = await import('@/services/obras')

      // Cargar trabajadores
      let data = await trabajadoresService.getAll()

      // Cargar obras
      let obrasData = await obrasService.getAll()

      // Cargar relaciones trabajadores-obras
      const { data: relacionesData } = await supabase
        .from('trabajadores_obras')
        .select('trabajador_id, obra_id, cargo_en_obra, fecha_asignacion, fecha_retiro, activo')
        .eq('activo', true)

      // Filtrar por obras asignadas al usuario si corresponde
      if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
        // Filtrar obras
        obrasData = obrasData.filter(obra => usuario.obras_asignadas!.includes(obra.id))

        // Obtener IDs de trabajadores asignados a las obras del usuario
        const asignaciones = relacionesData?.filter(rel =>
          usuario.obras_asignadas!.includes(rel.obra_id)
        ) || []

        const trabajadorIds = new Set(asignaciones.map(a => a.trabajador_id))

        // Filtrar trabajadores que estén asignados a las obras del usuario
        data = data.filter(t => trabajadorIds.has(t.id))

        // Filtrar relaciones
        setTrabajadoresObras(asignaciones)
      } else {
        setTrabajadoresObras(relacionesData || [])
      }

      setTrabajadores(data)
      setObras(obrasData)

      // Expandir todas las obras por defecto solo en la primera carga
      if (!esRefresh) {
        setObrasExpandidas(new Set(obrasData.map(o => o.id)))
      }
    } catch (error) {
      console.error('Error cargando trabajadores:', error)
    } finally {
      setLoading(false)
    }
  }, [usuario])

  useEffect(() => {
    cargarTrabajadores()
  }, [cargarTrabajadores])

  // Escuchar eventos de cambios en trabajadores y actualizar automáticamente
  useDataRefreshListener(
    ['trabajador-created', 'trabajador-updated', 'trabajador-deleted'],
    () => cargarTrabajadores(true) // Pasar true para indicar que es un refresh
  )

  const toggleObra = (obraId: number) => {
    setObrasExpandidas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(obraId)) {
        newSet.delete(obraId)
      } else {
        newSet.add(obraId)
      }
      return newSet
    })
  }

  const trabajadoresFiltrados = trabajadores.filter(t => {
    const busq =
      t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.rut.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.cargo.toLowerCase().includes(busqueda.toLowerCase())
    const est = filtroEstado === "todos" || t.estado === filtroEstado
    const cargo = filtroCargo === "todos" || t.cargo === filtroCargo
    return busq && est && cargo
  })

  // Agrupar trabajadores por obra
  const trabajadoresPorObra = obras.map(obra => {
    const trabajadoresDeObra = trabajadoresFiltrados.filter(t => {
      return trabajadoresObras.some(rel =>
        rel.obra_id === obra.id && rel.trabajador_id === t.id
      )
    })
    return {
      obra,
      trabajadores: trabajadoresDeObra,
      relaciones: trabajadoresObras.filter(rel => rel.obra_id === obra.id)
    }
  }).filter(grupo => grupo.trabajadores.length > 0)

  const cargosUnicos = Array.from(new Set(trabajadores.map(t => t.cargo))).filter(Boolean).sort()

  const estadisticas = {
    total: trabajadores.length,
    activos: trabajadores.filter(t => t.estado === 'activo').length,
    vacaciones: trabajadores.filter(t => t.estado === 'vacaciones').length,
    licencia: trabajadores.filter(t => t.estado === 'licencia').length,
    retirados: trabajadores.filter(t => t.estado === 'retirado').length
  }

  const getEstadoColor = (estado: Trabajador['estado']) => ({
    'activo': 'bg-green-100 text-green-800',
    'vacaciones': 'bg-blue-100 text-blue-800',
    'licencia': 'bg-yellow-100 text-yellow-800',
    'retirado': 'bg-gray-100 text-gray-800'
  }[estado])

  const getEstadoTexto = (estado: Trabajador['estado']) => ({
    'activo': 'Activo',
    'vacaciones': 'Vacaciones',
    'licencia': 'Licencia',
    'retirado': 'Retirado'
  }[estado])

  const handleTrabajadorClick = (id: number) => {
    if (onTrabajadorClick) {
      onTrabajadorClick(id)
    } else if (onSelectionChange) {
      // Si hay onSelectionChange, NO navegar - solo seleccionar
      onSelectionChange(id)
    } else {
      // Navegación tradicional solo si no hay handler de selección
      router.push(`/trabajadores/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando trabajadores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER - Solo si NO es vista compacta */}
      {!compact && (
        <div className="flex-shrink-0 p-6 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#0066cc' }}>
                Gestión de Trabajadores
              </h1>
              <p className="text-gray-600">{trabajadores.length} trabajadores registrados</p>
            </div>
            <Button
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
              onClick={() => onNuevoTrabajador && onNuevoTrabajador()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Trabajador
            </Button>
          </div>

          {/* Estadísticas - Solo en vista completa */}
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { title: 'Total', value: estadisticas.total, icon: UsersIcon, color: '#0066cc' },
              { title: 'Activos', value: estadisticas.activos, icon: TrendingUp, color: '#10b981' },
              { title: 'Vacaciones', value: estadisticas.vacaciones, icon: Clock, color: '#3b82f6' },
              { title: 'Licencia', value: estadisticas.licencia, icon: AlertCircle, color: '#f59e0b' },
              { title: 'Retirados', value: estadisticas.retirados, icon: UserX, color: '#6b7280' }
            ].map((stat, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Buscar por nombre, RUT o cargo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                  <SelectItem value="licencia">Licencia</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cargo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los cargos</SelectItem>
                  {cargosUnicos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={vistaAgrupada ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaAgrupada(true)}
              style={vistaAgrupada ? { backgroundColor: '#0066cc' } : undefined}
              className={!vistaAgrupada ? "text-gray-600" : "text-white"}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Vista por Obras
            </Button>
            <Button
              variant={!vistaAgrupada ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaAgrupada(false)}
              style={!vistaAgrupada ? { backgroundColor: '#0066cc' } : undefined}
              className={vistaAgrupada ? "text-gray-600" : "text-white"}
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              Vista Lista
            </Button>
          </div>
        </div>
      </div>

      {/* LISTA - Vista Agrupada por Obras o Lista Tradicional */}
      <div className="flex-1 overflow-y-auto">
        {trabajadoresFiltrados.length > 0 ? (
          vistaAgrupada ? (
            // VISTA AGRUPADA POR OBRAS
            <div className="divide-y divide-gray-200">
              {trabajadoresPorObra.map(({ obra, trabajadores: trabajadoresDeObra, relaciones }) => {
                const isExpanded = obrasExpandidas.has(obra.id)
                return (
                  <div key={obra.id} className="bg-white">
                    {/* Header de Obra - Clickeable para expandir/colapsar */}
                    <div
                      className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                      onClick={() => toggleObra(obra.id)}
                    >
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: '#0066cc' }}
                        >
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-gray-900 truncate">{obra.nombre}</h3>
                        <p className="text-sm text-gray-500">{obra.direccion}</p>
                      </div>
                      <Badge
                        className="text-xs font-semibold px-3 py-1"
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                      >
                        {trabajadoresDeObra.length} trabajador{trabajadoresDeObra.length !== 1 ? 'es' : ''}
                      </Badge>
                    </div>

                    {/* Lista de Trabajadores de esta Obra */}
                    {isExpanded && (
                      <div className="bg-gray-50/50">
                        {trabajadoresDeObra.map((trabajador) => {
                          const isSelected = selectedId === trabajador.id
                          const relacion = relaciones.find(r => r.trabajador_id === trabajador.id)
                          return (
                            <div
                              key={trabajador.id}
                              className={`
                                flex items-center gap-4 px-6 py-3 ml-12 cursor-pointer transition-all
                                hover:bg-white
                                ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                              `}
                              onClick={() => handleTrabajadorClick(trabajador.id)}
                            >
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                {trabajador.foto ? (
                                  <Image
                                    src={trabajador.foto}
                                    alt={trabajador.nombre}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold text-sm"
                                    style={{ backgroundColor: '#0066cc' }}
                                  >
                                    {trabajador.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </div>
                                )}
                              </div>

                              {/* Info Principal */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm truncate">{trabajador.nombre}</h3>
                                  <Badge className={getEstadoColor(trabajador.estado)} variant="secondary">
                                    {getEstadoTexto(trabajador.estado)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">{relacion?.cargo_en_obra || trabajador.cargo}</span>
                                  </span>
                                  {relacion?.cargo_en_obra && relacion.cargo_en_obra !== trabajador.cargo && (
                                    <span className="text-gray-400">• {trabajador.cargo}</span>
                                  )}
                                </div>
                              </div>

                              {/* RUT */}
                              <div className="hidden md:block flex-shrink-0 text-sm text-gray-500 w-28">
                                {trabajador.rut}
                              </div>

                              {/* Icono de ver */}
                              {!compact && (
                                <div className="flex-shrink-0">
                                  <Eye className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // VISTA LISTA TRADICIONAL
            <div className="divide-y divide-gray-100">
              {trabajadoresFiltrados.map((trabajador) => {
                const isSelected = selectedId === trabajador.id
                return (
                  <div
                    key={trabajador.id}
                    className={`
                      flex items-center gap-4 px-6 py-3 cursor-pointer transition-all
                      hover:bg-gray-50
                      ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                    `}
                    onClick={() => handleTrabajadorClick(trabajador.id)}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {trabajador.foto ? (
                        <Image
                          src={trabajador.foto}
                          alt={trabajador.nombre}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold text-sm"
                          style={{ backgroundColor: '#0066cc' }}
                        >
                          {trabajador.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Info Principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{trabajador.nombre}</h3>
                        <Badge className={getEstadoColor(trabajador.estado)} variant="secondary">
                          {getEstadoTexto(trabajador.estado)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{trabajador.cargo}</span>
                        </span>
                      </div>
                    </div>

                    {/* RUT */}
                    <div className="hidden md:block flex-shrink-0 text-sm text-gray-500 w-28">
                      {trabajador.rut}
                    </div>

                    {/* Icono de ver */}
                    {!compact && (
                      <div className="flex-shrink-0">
                        <Eye className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No se encontraron trabajadores</p>
              <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

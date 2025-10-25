"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  MapPin
} from "lucide-react"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { obrasService } from "@/services/obras"
import { documentosService, type CumplimientoObraDocumental } from "@/services/documentos"
import type { Obra, Usuario } from "@/lib/supabase"
import Link from "next/link"

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface DashboardVisitadorProps {
  usuario: Usuario
}

export default function DashboardVisitador({ usuario }: DashboardVisitadorProps) {
  const [loading, setLoading] = useState(true)
  const [obrasAsignadas, setObrasAsignadas] = useState<Obra[]>([])
  const [cumplimientoPorObra, setCumplimientoPorObra] = useState<Map<number, CumplimientoObraDocumental>>(new Map())

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const todasLasObras = await obrasService.getAll()

        let obrasFiltradas: Obra[]
        if (usuario.obras_asignadas === null) {
          obrasFiltradas = todasLasObras
        } else if (usuario.obras_asignadas && usuario.obras_asignadas.length > 0) {
          obrasFiltradas = todasLasObras.filter(o =>
            usuario.obras_asignadas!.includes(o.id)
          )
        } else {
          obrasFiltradas = []
        }

        setObrasAsignadas(obrasFiltradas)

        // Calcular cumplimiento documental de TODAS las obras en una sola pasada (OPTIMIZADO)
        if (obrasFiltradas.length > 0) {
          try {
            const obrasIds = obrasFiltradas.map(o => o.id)
            const cumplimientoMap = await documentosService.calcularCumplimientoVariasObras(obrasIds)
            setCumplimientoPorObra(cumplimientoMap)
          } catch (error) {
            console.error('Error calculando cumplimiento de obras:', error)
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [usuario])

  // Calcular métricas
  const totalTrabajadores = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.totalTrabajadores, 0
  )

  const obrasEnCurso = obrasAsignadas.filter(o => o.estado === 'en-progreso').length

  const alertasDocumentales = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.trabajadoresCriticos, 0
  )

  const documentosVencidos = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.documentosVencidosTotal, 0
  )

  const documentosPorVencer = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.documentosPorVencerTotal, 0
  )

  const progresoPromedio = obrasAsignadas.length > 0
    ? Math.round(obrasAsignadas.reduce((sum, o) => sum + o.progreso, 0) / obrasAsignadas.length)
    : 0

  // Datos para gráfico de cumplimiento documental
  const trabajadoresAlDia = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.trabajadoresAlDia, 0
  )
  const trabajadoresPendientes = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.trabajadoresPendientes, 0
  )
  const trabajadoresCriticos = Array.from(cumplimientoPorObra.values()).reduce(
    (sum, c) => sum + c.trabajadoresCriticos, 0
  )

  const cumplimientoData = {
    labels: ['Al Día', 'Pendientes', 'Críticos'],
    datasets: [{
      data: [trabajadoresAlDia, trabajadoresPendientes, trabajadoresCriticos],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 8
    }]
  }

  // Datos para gráfico de obras por estado
  const obrasEstadoData = {
    labels: ['En Progreso', 'Planificación', 'Pausada', 'Terminada'],
    datasets: [{
      data: [
        obrasAsignadas.filter(o => o.estado === 'en-progreso').length,
        obrasAsignadas.filter(o => o.estado === 'planificacion').length,
        obrasAsignadas.filter(o => o.estado === 'pausada').length,
        obrasAsignadas.filter(o => o.estado === 'terminada').length
      ],
      backgroundColor: ['#0066cc', '#f59e0b', '#ef4444', '#10b981'],
      borderRadius: 8,
      barThickness: 40
    }]
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (obrasAsignadas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Building2 className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sin Obras Asignadas</h2>
        <p className="text-gray-600 max-w-md">
          Actualmente no tienes obras asignadas. Contacta con tu supervisor para obtener acceso.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {usuario.nombre.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          Dashboard Visitador - {obrasAsignadas.length} {obrasAsignadas.length === 1 ? 'obra asignada' : 'obras asignadas'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Obras en Curso
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#0066cc15' }}>
              <Building2 className="h-5 w-5" style={{ color: '#0066cc' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{obrasEnCurso}</div>
            <p className="text-xs text-gray-500 mt-1">de {obrasAsignadas.length} totales</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Trabajadores
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#10b98115' }}>
              <Users className="h-5 w-5" style={{ color: '#10b981' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalTrabajadores}</div>
            <p className="text-xs text-gray-500 mt-1">en tus obras</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Progreso Promedio
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#8b5cf615' }}>
              <TrendingUp className="h-5 w-5" style={{ color: '#8b5cf6' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{progresoPromedio}%</div>
            <p className="text-xs text-gray-500 mt-1">de tus obras</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alertas Críticas
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: alertasDocumentales > 0 ? '#ef444415' : '#10b98115' }}>
              {alertasDocumentales > 0 ? (
                <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
              ) : (
                <CheckCircle2 className="h-5 w-5" style={{ color: '#10b981' }} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{alertasDocumentales}</div>
            <p className="text-xs text-gray-500 mt-1">
              {alertasDocumentales === 0 ? 'Todo al día' : 'trabajadores'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Documentales */}
      {(documentosVencidos > 0 || documentosPorVencer > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {documentosVencidos > 0 && (
            <Card className="border-0 shadow-md border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Documentos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">{documentosVencidos}</div>
                <p className="text-sm text-gray-600">
                  Documentos vencidos que requieren atención inmediata
                </p>
              </CardContent>
            </Card>
          )}

          {documentosPorVencer > 0 && (
            <Card className="border-0 shadow-md border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Próximos a Vencer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">{documentosPorVencer}</div>
                <p className="text-sm text-gray-600">
                  Documentos que vencen en los próximos 30 días
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Cumplimiento Documental</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {totalTrabajadores > 0 ? (
                <Doughnut
                  data={cumplimientoData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 15,
                          font: { size: 12 },
                          usePointStyle: true
                        }
                      }
                    },
                    cutout: '70%'
                  }}
                />
              ) : (
                <p className="text-gray-400">Sin trabajadores</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Obras por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={obrasEstadoData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                      grid: { color: '#f3f4f6' }
                    },
                    x: {
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listado de Obras con Detalle */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" style={{ color: '#0066cc' }} />
            Mis Obras para Visitar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {obrasAsignadas.map(obra => {
              const cumplimiento = cumplimientoPorObra.get(obra.id)

              return (
                <Link
                  key={obra.id}
                  href={`/obras/${obra.id}`}
                  className="block p-5 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{obra.nombre}</h3>
                        <Badge
                          className={
                            obra.estado === 'en-progreso' ? 'bg-blue-100 text-blue-800' :
                            obra.estado === 'planificacion' ? 'bg-yellow-100 text-yellow-800' :
                            obra.estado === 'pausada' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }
                          variant="secondary"
                        >
                          {obra.estado}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{obra.direccion}, {obra.comuna}, {obra.region}</span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          Cliente: {obra.cliente}
                        </span>
                        {cumplimiento && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {cumplimiento.totalTrabajadores} trabajadores
                          </span>
                        )}
                        {obra.fecha_inicio && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Inicio: {new Date(obra.fecha_inicio).toLocaleDateString('es-CL')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso de Obra</span>
                      <span className="font-medium">{obra.progreso}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${obra.progreso}%` }}
                      />
                    </div>
                  </div>

                  {/* Métricas de Cumplimiento */}
                  {cumplimiento && cumplimiento.totalTrabajadores > 0 && (
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {cumplimiento.trabajadoresAlDia}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Al Día</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-lg font-bold text-yellow-600">
                            {cumplimiento.trabajadoresPendientes}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Pendientes</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-lg font-bold text-red-600">
                            {cumplimiento.trabajadoresCriticos}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Críticos</p>
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

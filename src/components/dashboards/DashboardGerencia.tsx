"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  MapPin,
  Briefcase
} from "lucide-react"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { trabajadoresService } from "@/services/trabajadores"
import { obrasService } from "@/services/obras"
import { documentosService } from "@/services/documentos"
import type { Trabajador, Obra, Usuario } from "@/lib/supabase"

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement)

interface DashboardGerenciaProps {
  usuario: Usuario
}

export default function DashboardGerencia({ usuario }: DashboardGerenciaProps) {
  const [loading, setLoading] = useState(true)
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [estadisticasDocumentales, setEstadisticasDocumentales] = useState({
    totalTrabajadores: 0,
    trabajadoresAlDia: 0,
    trabajadoresPendientes: 0,
    trabajadoresCriticos: 0,
    porcentajeGeneral: 0,
    documentosVencidosTotal: 0,
    documentosPorVencerTotal: 0
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [trabajadoresDataRaw, obrasDataRaw, docStats] = await Promise.all([
          trabajadoresService.getAll(),
          obrasService.getAll(),
          documentosService.getEstadisticasGlobales()
        ])

        let trabajadoresData = trabajadoresDataRaw
        let obrasData = obrasDataRaw

        // Filtrar por obras asignadas al usuario si corresponde
        if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
          obrasData = obrasData.filter(obra => usuario.obras_asignadas!.includes(obra.id))

          // Obtener IDs de trabajadores asignados a las obras del usuario
          const { supabase } = await import('@/lib/supabase')
          const { data: asignaciones } = await supabase
            .from('trabajadores_obras')
            .select('trabajador_id')
            .in('obra_id', usuario.obras_asignadas)
            .eq('activo', true)

          const trabajadorIds = new Set(asignaciones?.map(a => a.trabajador_id) || [])
          trabajadoresData = trabajadoresData.filter(t => trabajadorIds.has(t.id))
        }

        setTrabajadores(trabajadoresData)
        setObras(obrasData)
        setEstadisticasDocumentales(docStats)
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Calcular KPIs
  const trabajadoresActivos = trabajadores.filter(t => t.estado === 'activo').length
  const obrasEnCurso = obras.filter(o => o.estado === 'en-progreso').length
  const presupuestoTotal = obras.reduce((sum, o) => sum + (o.monto_contrato || 0), 0)
  const progresoPromedio = obras.length > 0
    ? Math.round(obras.reduce((sum, o) => sum + o.progreso, 0) / obras.length)
    : 0

  // Gráfico: Cumplimiento Documental Global
  const cumplimientoData = {
    labels: ['Al Día', 'Pendientes', 'Críticos'],
    datasets: [{
      data: [
        estadisticasDocumentales.trabajadoresAlDia,
        estadisticasDocumentales.trabajadoresPendientes,
        estadisticasDocumentales.trabajadoresCriticos
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 8
    }]
  }

  // Gráfico: Distribución por Nivel
  const niveles = ['obrero', 'tecnico', 'profesional', 'jefatura', 'gerencia']
  const categoriaData = {
    labels: niveles.map(n => n.charAt(0).toUpperCase() + n.slice(1)),
    datasets: [{
      label: 'Trabajadores',
      data: niveles.map(nivel =>
        trabajadores.filter(t => t.nivel === nivel).length
      ),
      backgroundColor: ['#0066cc', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
      borderRadius: 8,
      barThickness: 40
    }]
  }

  // Gráfico: Top 5 Cargos
  const cargos = [...new Set(trabajadores.map(t => t.cargo).filter(Boolean))]
  const topCargos = cargos
    .map(cargo => ({
      nombre: cargo,
      count: trabajadores.filter(t => t.cargo === cargo).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const cargoData = {
    labels: topCargos.map(e => e.nombre),
    datasets: [{
      label: 'Trabajadores',
      data: topCargos.map(e => e.count),
      backgroundColor: '#0066cc',
      borderRadius: 8,
      barThickness: 30
    }]
  }

  // Top 5 Obras por Cantidad de Trabajadores
  const [obrasConTrabajadores, setObrasConTrabajadores] = useState<Array<{
    obra: Obra
    trabajadores: number
  }>>([])

  useEffect(() => {
    const calcularObrasConTrabajadores = async () => {
      // OPTIMIZADO: Calcular cumplimiento de TODAS las obras en una sola pasada
      const obrasIds = obras.map(o => o.id)
      const cumplimientoMap = await documentosService.calcularCumplimientoVariasObras(obrasIds)

      const resultados = obras.map(obra => ({
        obra,
        trabajadores: cumplimientoMap.get(obra.id)?.totalTrabajadores || 0
      }))

      const top5 = resultados
        .sort((a, b) => b.trabajadores - a.trabajadores)
        .slice(0, 5)

      setObrasConTrabajadores(top5)
    }

    if (obras.length > 0 && !loading) {
      calcularObrasConTrabajadores()
    }
  }, [obras, loading])

  // Distribución geográfica (por comuna)
  const comunas = [...new Set(obras.map(o => o.comuna).filter(Boolean))]
  const topComunas = comunas
    .map(comuna => ({
      nombre: comuna,
      count: obras.filter(o => o.comuna === comuna).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 gradient-text">
            Dashboard Ejecutivo
          </h1>
          <p className="text-gray-600 mt-1">Vista completa de la empresa - {usuario.nombre}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity className="h-4 w-4" />
          <span>Actualizado ahora</span>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#0066cc' }} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trabajadores Activos
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#0066cc15' }}>
              <Users className="h-5 w-5" style={{ color: '#0066cc' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{trabajadoresActivos}</div>
            <p className="text-xs text-gray-500 mt-1">
              de {trabajadores.length} totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#10b981' }} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Obras en Curso
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#10b98115' }}>
              <Building2 className="h-5 w-5" style={{ color: '#10b981' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{obrasEnCurso}</div>
            <p className="text-xs text-gray-500 mt-1">
              de {obras.length} totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#f59e0b' }} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Presupuesto Total
            </CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#f59e0b15' }}>
              <DollarSign className="h-5 w-5" style={{ color: '#f59e0b' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${(presupuestoTotal / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">
              obras en progreso
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#8b5cf6' }} />
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
            <p className="text-xs text-gray-500 mt-1">
              de las obras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticas */}
      {(estadisticasDocumentales.documentosVencidosTotal > 0 || estadisticasDocumentales.trabajadoresCriticos > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-md border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                Situación Crítica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {estadisticasDocumentales.trabajadoresCriticos}
                  </div>
                  <p className="text-sm text-gray-600">Trabajadores con documentación crítica</p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-2xl font-bold text-red-600">
                    {estadisticasDocumentales.documentosVencidosTotal}
                  </div>
                  <p className="text-sm text-gray-600">Documentos vencidos totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                Próximos a Vencer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-yellow-600">
                    {estadisticasDocumentales.trabajadoresPendientes}
                  </div>
                  <p className="text-sm text-gray-600">Trabajadores con documentación pendiente</p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-2xl font-bold text-yellow-600">
                    {estadisticasDocumentales.documentosPorVencerTotal}
                  </div>
                  <p className="text-sm text-gray-600">Documentos por vencer (30 días)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos: Fila 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Cumplimiento Documental Global</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {estadisticasDocumentales.porcentajeGeneral}% de cumplimiento general
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
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
            </div>
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {estadisticasDocumentales.trabajadoresAlDia} trabajadores al día
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Categoría</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Trabajadores según categoría laboral</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={categoriaData}
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

      {/* Gráficos: Fila 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Cargos</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Cargos más comunes</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={cargoData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                      grid: { color: '#f3f4f6' }
                    },
                    y: {
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" style={{ color: '#0066cc' }} />
              Distribución Geográfica
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Top 5 comunas con más obras</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topComunas.map((comuna, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{comuna.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${(comuna.count / Math.max(...topComunas.map(c => c.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">{comuna.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Obras por Trabajadores */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" style={{ color: '#0066cc' }} />
            Top 5 Obras con Más Trabajadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {obrasConTrabajadores.map((item, index) => (
              <div
                key={item.obra.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.obra.nombre}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.obra.comuna}
                      </span>
                      <span>•</span>
                      <Badge
                        className={
                          item.obra.estado === 'en-progreso' ? 'bg-blue-100 text-blue-800' :
                          item.obra.estado === 'planificacion' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }
                        variant="secondary"
                      >
                        {item.obra.estado}
                      </Badge>
                      <span>•</span>
                      <span>{item.obra.progreso}% progreso</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-gray-900">{item.trabajadores}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

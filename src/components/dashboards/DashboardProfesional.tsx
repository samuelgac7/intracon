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
  Clock
} from "lucide-react"
import { obrasService } from "@/services/obras"
import { documentosService, type CumplimientoObraDocumental } from "@/services/documentos"
import type { Obra, Usuario } from "@/lib/supabase"
import Link from "next/link"

interface DashboardProfesionalProps {
  usuario: Usuario
}

export default function DashboardProfesional({ usuario }: DashboardProfesionalProps) {
  const [loading, setLoading] = useState(true)
  const [obrasAsignadas, setObrasAsignadas] = useState<Obra[]>([])
  const [cumplimientoPorObra, setCumplimientoPorObra] = useState<Map<number, CumplimientoObraDocumental>>(new Map())

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener todas las obras
        const todasLasObras = await obrasService.getAll()

        // Filtrar según obras asignadas al usuario
        let obrasFiltradas: Obra[]

        if (usuario.obras_asignadas === null) {
          // null = acceso a todas las obras
          obrasFiltradas = todasLasObras
        } else if (usuario.obras_asignadas && usuario.obras_asignadas.length > 0) {
          // Array con IDs específicos
          obrasFiltradas = todasLasObras.filter(o =>
            usuario.obras_asignadas!.includes(o.id)
          )
        } else {
          // Array vacío = sin obras
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

  // Calcular totales
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
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
          Dashboard Profesional - {obrasAsignadas.length} {obrasAsignadas.length === 1 ? 'obra asignada' : 'obras asignadas'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
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
              Trabajadores
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
              Alertas Documentales
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
              {alertasDocumentales === 0 ? 'Todo al día' : 'trabajadores críticos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticas */}
      {documentosVencidos > 0 && (
        <Card className="border-0 shadow-md border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-red-600" />
              Documentos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Hay <span className="font-bold text-red-600">{documentosVencidos}</span> documentos vencidos
              en tus obras. Revisa el detalle de cada obra para regularizar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Listado de Obras Asignadas */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Mis Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {obrasAsignadas.map(obra => {
              const cumplimiento = cumplimientoPorObra.get(obra.id)

              return (
                <Link
                  key={obra.id}
                  href={`/obras/${obra.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{obra.nombre}</h3>
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

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {obra.direccion}, {obra.comuna}
                        </span>
                        {cumplimiento && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {cumplimiento.totalTrabajadores} trabajadores
                            </span>
                          </>
                        )}
                      </div>

                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progreso</span>
                          <span className="font-medium">{obra.progreso}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${obra.progreso}%` }}
                          />
                        </div>
                      </div>

                      {/* Cumplimiento Documental */}
                      {cumplimiento && cumplimiento.totalTrabajadores > 0 && (
                        <div className="mt-3 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">
                              {cumplimiento.trabajadoresAlDia} al día
                            </span>
                          </div>
                          {cumplimiento.trabajadoresCriticos > 0 && (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-gray-600">
                                {cumplimiento.trabajadoresCriticos} críticos
                              </span>
                            </div>
                          )}
                          {cumplimiento.documentosPorVencerTotal > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <span className="text-gray-600">
                                {cumplimiento.documentosPorVencerTotal} por vencer
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

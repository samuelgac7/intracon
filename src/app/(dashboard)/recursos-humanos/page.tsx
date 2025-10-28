"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Calendar, DollarSign, UserCheck, UserX,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { trabajadoresService } from '@/services/trabajadores'
import { contratosService, type AlertaContrato } from '@/services/contratos'
import { obrasService } from '@/services/obras'
import Link from 'next/link'

interface EstadisticasRRHH {
  trabajadores: {
    total: number
    activos: number
    inactivos: number
    porEstado: {
      activo: number
      vacaciones: number
      licencia: number
      retirado: number
    }
  }
  contratos: {
    total: number
    vencidos: number
    vencenEn7Dias: number
    vencenEn30Dias: number
    vigentes: number
  }
  obras: {
    total: number
    conTrabajadores: number
    sinTrabajadores: number
  }
}

export default function RecursosHumanosPage() {
  const { usuario } = useAuth()
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState<EstadisticasRRHH | null>(null)
  const [alertasUrgentes, setAlertasUrgentes] = useState<AlertaContrato[]>([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar trabajadores
      let trabajadores = await trabajadoresService.getAll()

      // Cargar alertas de contratos
      let alertas = await contratosService.getAlertas()

      // Cargar obras
      let obras = await obrasService.getAll()

      // Filtrar por obras asignadas al usuario si corresponde
      if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
        obras = obras.filter(obra => usuario.obras_asignadas!.includes(obra.id))

        // Obtener IDs de trabajadores asignados a las obras del usuario
        const { supabase } = await import('@/lib/supabase')
        const { data: asignaciones } = await supabase
          .from('trabajadores_obras')
          .select('trabajador_id')
          .in('obra_id', usuario.obras_asignadas)
          .eq('activo', true)

        const trabajadorIds = new Set(asignaciones?.map(a => a.trabajador_id) || [])

        // Filtrar trabajadores que estén asignados a las obras del usuario
        trabajadores = trabajadores.filter(t => trabajadorIds.has(t.id))

        // Filtrar alertas por trabajadores de las obras asignadas
        alertas = alertas.filter(a => trabajadorIds.has(a.trabajador_id))
      }

      // Calcular estadísticas de trabajadores
      const trabajadoresActivos = trabajadores.filter(t => t.estado === 'activo').length
      const trabajadoresInactivos = trabajadores.filter(t => t.estado !== 'activo').length

      const porEstado = {
        activo: trabajadores.filter(t => t.estado === 'activo').length,
        vacaciones: trabajadores.filter(t => t.estado === 'vacaciones').length,
        licencia: trabajadores.filter(t => t.estado === 'licencia').length,
        retirado: trabajadores.filter(t => t.estado === 'retirado').length,
      }

      // Calcular estadísticas de contratos
      const contratosVencidos = alertas.filter(a => a.urgencia === 'VENCIDO').length
      const contratosVencen7 = alertas.filter(a => a.urgencia === 'POR_VENCER' && a.dias_restantes <= 7).length
      const contratosVencen30 = alertas.filter(a => a.urgencia === 'POR_VENCER' && a.dias_restantes <= 30).length
      const contratosVigentes = trabajadores.length - alertas.length

      // Alertas urgentes (vencidos y que vencen hoy o en 7 días)
      const urgentes = alertas
        .filter(a => a.urgencia === 'VENCIDO' || a.urgencia === 'VENCE_HOY' || a.dias_restantes <= 7)
        .sort((a, b) => a.dias_restantes - b.dias_restantes)
        .slice(0, 5)

      setEstadisticas({
        trabajadores: {
          total: trabajadores.length,
          activos: trabajadoresActivos,
          inactivos: trabajadoresInactivos,
          porEstado
        },
        contratos: {
          total: trabajadores.length,
          vencidos: contratosVencidos,
          vencenEn7Dias: contratosVencen7,
          vencenEn30Dias: contratosVencen30,
          vigentes: contratosVigentes
        },
        obras: {
          total: obras.length,
          conTrabajadores: obras.filter(o => o.estado === 'en-progreso').length,
          sinTrabajadores: obras.filter(o => o.estado === 'planificacion').length
        }
      })

      setAlertasUrgentes(urgentes)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-500 mt-1">Gestión integral de personal y contratos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trabajadores">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Ver Trabajadores
            </Button>
          </Link>
          <Link href="/recursos-humanos/documentacion">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Gestión Documental
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Trabajadores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Trabajadores
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {estadisticas?.trabajadores.total || 0}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <UserCheck className="h-4 w-4" />
                <span>{estadisticas?.trabajadores.activos || 0} activos</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <UserX className="h-4 w-4" />
                <span>{estadisticas?.trabajadores.inactivos || 0} inactivos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contratos Vencidos */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Contratos Vencidos
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {estadisticas?.contratos.vencidos || 0}
            </div>
            <p className="text-xs text-red-600 mt-2">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        {/* Contratos por Vencer (7 días) */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Vencen en 7 días
            </CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {estadisticas?.contratos.vencenEn7Dias || 0}
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Programar renovaciones
            </p>
          </CardContent>
        </Card>

        {/* Contratos Vigentes */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Contratos Vigentes
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {estadisticas?.contratos.vigentes || 0}
            </div>
            <p className="text-xs text-green-600 mt-2">
              Sin alertas pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Distribución de Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Activos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {estadisticas?.trabajadores.porEstado.activo || 0}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({Math.round(((estadisticas?.trabajadores.porEstado.activo || 0) / (estadisticas?.trabajadores.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Vacaciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {estadisticas?.trabajadores.porEstado.vacaciones || 0}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({Math.round(((estadisticas?.trabajadores.porEstado.vacaciones || 0) / (estadisticas?.trabajadores.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700">Licencia</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {estadisticas?.trabajadores.porEstado.licencia || 0}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({Math.round(((estadisticas?.trabajadores.porEstado.licencia || 0) / (estadisticas?.trabajadores.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-700">Retirados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {estadisticas?.trabajadores.porEstado.retirado || 0}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({Math.round(((estadisticas?.trabajadores.porEstado.retirado || 0) / (estadisticas?.trabajadores.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Urgentes */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Alertas Urgentes
              </div>
              {alertasUrgentes.length > 0 && (
                <Badge className="bg-red-600 text-white">
                  {alertasUrgentes.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertasUrgentes.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No hay alertas urgentes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertasUrgentes.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {alerta.trabajador_nombre}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {alerta.obra_nombre}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {alerta.urgencia === 'VENCIDO'
                          ? '¡Contrato vencido!'
                          : `Vence en ${alerta.dias_restantes} día${alerta.dias_restantes !== 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                    <Link href={`/trabajadores/${alerta.trabajador_id}`}>
                      <Button size="sm" variant="outline" className="flex-shrink-0">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}

                {alertasUrgentes.length > 0 && (
                  <Link href="/recursos-humanos/documentacion">
                    <Button variant="outline" className="w-full mt-2">
                      Ver todas las alertas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/trabajadores">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Trabajadores</span>
              </Button>
            </Link>

            <Link href="/recursos-humanos/documentacion">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <FileText className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Documentación</span>
              </Button>
            </Link>

            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2" disabled>
              <Calendar className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Asistencia</span>
              <Badge variant="outline" className="text-xs">Próximamente</Badge>
            </Button>

            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2" disabled>
              <DollarSign className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Nómina</span>
              <Badge variant="outline" className="text-xs">Próximamente</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

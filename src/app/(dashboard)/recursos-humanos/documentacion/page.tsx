"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle, CheckCircle2, Clock, Users, Building2,
  ChevronDown, ChevronRight, Search, Plus, Eye, ExternalLink,
  Send
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { obrasService } from '@/services/obras'
import { contratosService, type AlertaContrato } from '@/services/contratos'
import type { Obra } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface AlertaPorTrabajador {
  trabajadorId: number
  trabajadorNombre: string
  trabajadorRut: string
  contratos: AlertaContrato[]
  urgenciaMaxima: 'VENCIDO' | 'VENCE_HOY' | 'POR_VENCER'
  diasMinimos: number
}

interface AlertaPorObra {
  obra: Obra
  alertas: AlertaContrato[]
  vencidos: number
  vencenHoy: number
  porVencer: number
}

export default function GestionDocumentalPage() {
  const { sesion, usuario } = useAuth()
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<AlertaContrato[]>([])
  const [obras, setObras] = useState<Obra[]>([])

  // Estados de UI
  const [expandedTrabajadores, setExpandedTrabajadores] = useState<Set<number>>(new Set())
  const [expandedObras, setExpandedObras] = useState<Set<number>>(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('todos')
  const [filtroObra, setFiltroObra] = useState<string>('todas')
  const [enviandoNotificaciones, setEnviandoNotificaciones] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Obtener todas las obras o solo las asignadas
      let obrasData = await obrasService.getAll()

      // Filtrar por obras asignadas al usuario
      if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
        obrasData = obrasData.filter(obra => usuario.obras_asignadas!.includes(obra.id))
      }

      setObras(obrasData)

      // Obtener alertas de contratos
      const alertasData = await contratosService.getAlertas()

      // Filtrar alertas por obras asignadas
      const alertasFiltradas = usuario?.obras_asignadas && usuario.obras_asignadas.length > 0
        ? alertasData.filter(a => usuario.obras_asignadas!.includes(a.obra_id))
        : alertasData

      setAlertas(alertasFiltradas)
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar alertas de contratos: ' + (error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const toggleTrabajador = (trabajadorId: number) => {
    const newExpanded = new Set(expandedTrabajadores)
    if (newExpanded.has(trabajadorId)) {
      newExpanded.delete(trabajadorId)
    } else {
      newExpanded.add(trabajadorId)
    }
    setExpandedTrabajadores(newExpanded)
  }

  const toggleObra = (obraId: number) => {
    const newExpanded = new Set(expandedObras)
    if (newExpanded.has(obraId)) {
      newExpanded.delete(obraId)
    } else {
      newExpanded.add(obraId)
    }
    setExpandedObras(newExpanded)
  }

  // Agrupar alertas por trabajador
  const alertasPorTrabajador: AlertaPorTrabajador[] = Object.values(
    alertas.reduce((acc, alerta) => {
      if (!acc[alerta.trabajador_id]) {
        acc[alerta.trabajador_id] = {
          trabajadorId: alerta.trabajador_id,
          trabajadorNombre: alerta.trabajador_nombre,
          trabajadorRut: alerta.trabajador_rut,
          contratos: [],
          urgenciaMaxima: 'POR_VENCER' as const,
          diasMinimos: 999
        }
      }

      acc[alerta.trabajador_id].contratos.push(alerta)

      // Determinar urgencia máxima
      if (alerta.urgencia === 'VENCIDO') {
        acc[alerta.trabajador_id].urgenciaMaxima = 'VENCIDO'
      } else if (alerta.urgencia === 'VENCE_HOY' && acc[alerta.trabajador_id].urgenciaMaxima !== 'VENCIDO') {
        acc[alerta.trabajador_id].urgenciaMaxima = 'VENCE_HOY'
      }

      // Días mínimos
      if (alerta.dias_restantes < acc[alerta.trabajador_id].diasMinimos) {
        acc[alerta.trabajador_id].diasMinimos = alerta.dias_restantes
      }

      return acc
    }, {} as Record<number, AlertaPorTrabajador>)
  ).sort((a, b) => a.diasMinimos - b.diasMinimos) // Ordenar por más críticos primero

  // Agrupar alertas por obra
  const alertasPorObra: AlertaPorObra[] = obras
    .map(obra => {
      const alertasObra = alertas.filter(a => a.obra_id === obra.id)
      return {
        obra,
        alertas: alertasObra,
        vencidos: alertasObra.filter(a => a.urgencia === 'VENCIDO').length,
        vencenHoy: alertasObra.filter(a => a.urgencia === 'VENCE_HOY').length,
        porVencer: alertasObra.filter(a => a.urgencia === 'POR_VENCER').length
      }
    })
    .filter(o => o.alertas.length > 0)
    .sort((a, b) => b.vencidos - a.vencidos) // Ordenar por más vencidos primero

  // Aplicar filtros
  const alertasTrabajadoresFiltradas = alertasPorTrabajador.filter(at => {
    // Filtro de búsqueda
    if (busqueda && !at.trabajadorNombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !at.trabajadorRut.includes(busqueda)) {
      return false
    }

    // Filtro de urgencia
    if (filtroUrgencia !== 'todos') {
      if (!at.contratos.some(c => c.urgencia === filtroUrgencia)) {
        return false
      }
    }

    // Filtro de obra
    if (filtroObra !== 'todas') {
      if (!at.contratos.some(c => c.obra_id === parseInt(filtroObra))) {
        return false
      }
    }

    return true
  })

  const alertasObrasFiltradas = alertasPorObra.filter(ao => {
    if (filtroObra !== 'todas' && ao.obra.id !== parseInt(filtroObra)) {
      return false
    }
    return true
  })

  // Contadores generales
  const contadores = {
    vencidos: alertas.filter(a => a.urgencia === 'VENCIDO').length,
    vencenHoy: alertas.filter(a => a.urgencia === 'VENCE_HOY').length,
    porVencer7dias: alertas.filter(a => a.urgencia === 'POR_VENCER' && a.dias_restantes <= 7).length,
    porVencer15dias: alertas.filter(a => a.urgencia === 'POR_VENCER' && a.dias_restantes <= 15).length,
    porVencer30dias: alertas.filter(a => a.urgencia === 'POR_VENCER' && a.dias_restantes <= 30).length,
    trabajadoresAfectados: new Set(alertas.map(a => a.trabajador_id)).size,
    obrasAfectadas: new Set(alertas.map(a => a.obra_id)).size
  }

  const getUrgenciaBadge = (urgencia: 'VENCIDO' | 'VENCE_HOY' | 'POR_VENCER', diasRestantes?: number) => {
    if (urgencia === 'VENCIDO') {
      return (
        <Badge className="bg-red-600 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO
        </Badge>
      )
    }
    if (urgencia === 'VENCE_HOY') {
      return (
        <Badge className="bg-orange-600 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCE HOY
        </Badge>
      )
    }

    // Por vencer - color según días
    const dias = diasRestantes || 0
    if (dias <= 7) {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          {dias} día{dias !== 1 ? 's' : ''}
        </Badge>
      )
    } else if (dias <= 15) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {dias} días
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          {dias} días
        </Badge>
      )
    }
  }

  const getSemaforoTrabajador = (urgencia: 'VENCIDO' | 'VENCE_HOY' | 'POR_VENCER') => {
    if (urgencia === 'VENCIDO') return '🔴'
    if (urgencia === 'VENCE_HOY') return '🟠'
    return '🟡'
  }

  const handleEnviarNotificaciones = async () => {
    if (!confirm('¿Enviar notificaciones de contratos que vencen en 7 días a los profesionales encargados?')) {
      return
    }

    try {
      setEnviandoNotificaciones(true)

      const response = await fetch('/api/notificaciones/contratos-vencer', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_CRON_API_KEY || 'dev-key-change-in-production'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error enviando notificaciones')
      }

      alert(`✅ ${data.notificacionesEnviadas} notificación(es) enviada(s) exitosamente${data.errores ? `\n\n⚠️ Algunos errores: ${data.errores.join(', ')}` : ''}`)
    } catch (error) {
      console.error('Error enviando notificaciones:', error)
      alert(`❌ Error enviando notificaciones: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Error desconocido'}`)
    } finally {
      setEnviandoNotificaciones(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando alertas de contratos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión Documental - Contratos</h1>
          <p className="text-gray-500 mt-1">
            Control de vencimientos de contratos y anexos de plazo
            {usuario?.obras_asignadas && usuario.obras_asignadas.length > 0 && (
              <span className="ml-2 text-sm">
                (Mostrando {obras.length} obra{obras.length !== 1 ? 's' : ''} asignada{obras.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>

        {sesion?.rol === 'super-admin' && (
          <Button
            onClick={handleEnviarNotificaciones}
            disabled={enviandoNotificaciones}
            variant="outline"
            className="flex items-center gap-2"
          >
            {enviandoNotificaciones ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Notificaciones
              </>
            )}
          </Button>
        )}
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{contadores.vencidos}</div>
                <div className="text-sm text-gray-600">Vencidos</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{contadores.porVencer7dias}</div>
                <div className="text-sm text-gray-600">Vencen en 7 días</div>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{contadores.porVencer30dias}</div>
                <div className="text-sm text-gray-600">Vencen en 30 días</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{contadores.trabajadoresAfectados}</div>
                <div className="text-sm text-gray-600">Trabajadores</div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o RUT..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filtroUrgencia} onValueChange={setFiltroUrgencia}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las urgencias</SelectItem>
                <SelectItem value="VENCIDO">Vencidos</SelectItem>
                <SelectItem value="VENCE_HOY">Vencen hoy</SelectItem>
                <SelectItem value="POR_VENCER">Por vencer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroObra} onValueChange={setFiltroObra}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las obras</SelectItem>
                {obras.map(obra => (
                  <SelectItem key={obra.id} value={obra.id.toString()}>
                    {obra.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="trabajadores" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="trabajadores">
            <Users className="h-4 w-4 mr-2" />
            Por Trabajador ({alertasTrabajadoresFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="obras">
            <Building2 className="h-4 w-4 mr-2" />
            Por Obra ({alertasObrasFiltradas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Por Trabajador */}
        <TabsContent value="trabajadores" className="space-y-3 mt-6">
          {alertasTrabajadoresFiltradas.length > 0 ? (
            alertasTrabajadoresFiltradas.map((at) => {
              const isExpanded = expandedTrabajadores.has(at.trabajadorId)

              return (
                <Card key={at.trabajadorId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleTrabajador(at.trabajadorId)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div className="text-2xl">{getSemaforoTrabajador(at.urgenciaMaxima)}</div>
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{at.trabajadorNombre}</h3>
                          <p className="text-sm text-gray-600">{at.trabajadorRut}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-gray-100 text-gray-800">
                          {at.contratos.length} contrato{at.contratos.length !== 1 ? 's' : ''}
                        </Badge>
                        {getUrgenciaBadge(at.urgenciaMaxima, at.diasMinimos)}

                        <Link href={`/trabajadores/${at.trabajadorId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Detalle expandible */}
                    {isExpanded && (
                      <div className="mt-4 ml-8 space-y-2 border-t pt-3">
                        {at.contratos.map((contrato, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {contrato.numero_contrato}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {contrato.obra_nombre}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {getUrgenciaBadge(contrato.urgencia, contrato.dias_restantes)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Vence: {new Date(contrato.fecha_termino).toLocaleDateString('es-CL')}
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Generar Anexo
                          </Button>
                          <Link href={`/trabajadores/${at.trabajadorId}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver Ficha
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-3 text-green-500" />
                <p className="text-gray-600">
                  {alertas.length === 0
                    ? 'Todos los contratos están vigentes'
                    : 'No hay contratos que coincidan con los filtros'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Por Obra */}
        <TabsContent value="obras" className="space-y-3 mt-6">
          {alertasObrasFiltradas.length > 0 ? (
            alertasObrasFiltradas.map((ao) => {
              const isExpanded = expandedObras.has(ao.obra.id)

              return (
                <Card key={ao.obra.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleObra(ao.obra.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{ao.obra.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            {ao.alertas.length} contrato{ao.alertas.length !== 1 ? 's' : ''} con alertas
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {ao.vencidos > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {ao.vencidos} vencido{ao.vencidos !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {ao.vencenHoy > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">
                            {ao.vencenHoy} vence{ao.vencenHoy !== 1 ? 'n' : ''} hoy
                          </Badge>
                        )}
                        {ao.porVencer > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {ao.porVencer} por vencer
                          </Badge>
                        )}

                        <Link href={`/obras/${ao.obra.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Detalle expandible */}
                    {isExpanded && (
                      <div className="mt-4 ml-8 space-y-2 border-t pt-3">
                        {ao.alertas.map((alerta, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">{alerta.trabajador_nombre}</p>
                                <p className="text-xs text-gray-600">
                                  {alerta.numero_contrato} • {alerta.trabajador_rut}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {getUrgenciaBadge(alerta.urgencia, alerta.dias_restantes)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Vence: {new Date(alerta.fecha_termino).toLocaleDateString('es-CL')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-3 text-green-500" />
                <p className="text-gray-600">Todos los contratos de las obras están vigentes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

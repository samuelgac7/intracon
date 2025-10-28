"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Building2, Activity, Clock, CheckCircle2, MapPin, DollarSign, Calendar, Eye } from "lucide-react"
import { obrasService } from "@/services/obras"
import type { Obra } from "@/lib/supabase"

interface ObrasListProps {
  selectedId?: number
  compact?: boolean
  onObraClick?: (id: number) => void
  onNuevaObra?: () => void
}

export default function ObrasList({ 
  selectedId, 
  compact = false,
  onObraClick,
  onNuevaObra
}: ObrasListProps) {
  const router = useRouter()
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")

  useEffect(() => {
    cargarObras()
  }, [])

  const cargarObras = async () => {
    try {
      const data = await obrasService.getAll()
      setObras(data)
    } catch (error) {
      console.error('Error cargando obras:', error)
    } finally {
      setLoading(false)
    }
  }

  const obrasFiltradas = obras.filter(o => {
    const busq =
      o.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.direccion.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.comuna.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.cliente.toLowerCase().includes(busqueda.toLowerCase())
    const est = filtroEstado === "todos" || o.estado === filtroEstado
    return busq && est
  })

  const estadisticas = {
    total: obras.length,
    activas: obras.filter(o => o.estado === 'en-progreso').length,
    planificacion: obras.filter(o => o.estado === 'planificacion').length,
    finalizadas: obras.filter(o => o.estado === 'terminada').length
  }

  const getEstadoColor = (estado: Obra['estado']) => ({
    'planificacion': 'bg-yellow-100 text-yellow-800',
    'en-progreso': 'bg-blue-100 text-blue-800',
    'pausada': 'bg-red-100 text-red-800',
    'terminada': 'bg-green-100 text-green-800',
    'cancelada': 'bg-gray-100 text-gray-800'
  }[estado])

  const getEstadoTexto = (estado: Obra['estado']) => ({
    'planificacion': 'Planificación',
    'en-progreso': 'En Progreso',
    'pausada': 'Pausada',
    'terminada': 'Terminada',
    'cancelada': 'Cancelada'
  }[estado])

  const handleObraClick = (id: number) => {
    if (onObraClick) {
      onObraClick(id)
    } else {
      router.push(`/obras/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando obras...</p>
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
                Gestión de Obras
              </h1>
              <p className="text-gray-600">{obras.length} obra{obras.length !== 1 ? 's' : ''} registrada{obras.length !== 1 ? 's' : ''}</p>
            </div>
            <Button 
              className="text-white" 
              style={{ backgroundColor: '#0066cc' }}
              onClick={() => onNuevaObra && onNuevaObra()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Obra
            </Button>
          </div>

          {/* Estadísticas - Solo en vista completa */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { title: 'Total Obras', value: estadisticas.total, icon: Building2, color: '#0066cc' },
              { title: 'En Curso', value: estadisticas.activas, icon: Activity, color: '#3b82f6' },
              { title: 'Planificación', value: estadisticas.planificacion, icon: Clock, color: '#f59e0b' },
              { title: 'Finalizadas', value: estadisticas.finalizadas, icon: CheckCircle2, color: '#10b981' }
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

      {/* BÚSQUEDA Y FILTROS - Sticky */}
      <div className={`flex-shrink-0 bg-white border-b ${compact ? 'p-3' : 'p-6'}`}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar obra, ubicación o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="planificacion">Planificación</SelectItem>
                <SelectItem value="en-curso">En Curso</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* LISTA DE OBRAS - Scrolleable */}
      <div className={`flex-1 overflow-y-auto ${compact ? 'p-3' : 'p-6'}`}>
        {obrasFiltradas.length > 0 ? (
          <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {obrasFiltradas.map((obra) => {
              const isSelected = selectedId === obra.id
              
              return (
                <Card 
                  key={obra.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 shadow-md' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleObraClick(obra.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0" 
                          style={{ backgroundColor: '#0066cc20' }}
                        >
                          <Building2 className="h-6 w-6" style={{ color: '#0066cc' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{obra.nombre}</h3>
                          <p className="text-sm text-gray-500 truncate">{obra.cliente}</p>
                        </div>
                      </div>
                      <Badge className={getEstadoColor(obra.estado)}>
                        {getEstadoTexto(obra.estado)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{obra.direccion}, {obra.comuna}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 flex-shrink-0" />
                        <span>${(obra.monto_contrato || 0).toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>{new Date(obra.fecha_inicio).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Progreso */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-semibold" style={{ color: '#0066cc' }}>{obra.progreso}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${obra.progreso}%`,
                            backgroundColor: '#0066cc'
                          }}
                        />
                      </div>
                    </div>

                    {!compact && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleObraClick(obra.id)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />Ver Detalle
                        </Button>
                      </div>
                    )}

                    {isSelected && compact && (
                      <div className="flex justify-center pt-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#0066cc' }}></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay obras</h3>
              {!compact && (
                <Button 
                  className="text-white mt-4" 
                  style={{ backgroundColor: '#0066cc' }} 
                  onClick={() => onNuevaObra && onNuevaObra()}
                >
                  <Plus className="h-4 w-4 mr-2" />Agregar Obra
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
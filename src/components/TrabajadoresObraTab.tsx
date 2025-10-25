"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Users, Calendar, Briefcase, ExternalLink, Shield, Edit } from "lucide-react"
import { trabajadoresService } from "@/services/trabajadores"
import { supabase } from "@/lib/supabase"
import type { Trabajador } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface AsignacionTrabajador {
  id: number
  trabajador_id: number
  obra_id: number
  cargo_en_obra: string
  fecha_asignacion: string
  fecha_retiro?: string
  activo: boolean
  trabajadores?: Trabajador
}

interface TrabajadoresObraTabProps {
  obraId: number
  trabajadoresAsignados: any[]
  onAsignar: (trabajadorId: number, cargoEnObra: string) => void
  onRetirar: (trabajadorId: number) => void
}

export default function TrabajadoresObraTab({
  obraId,
  onAsignar,
  onRetirar
}: TrabajadoresObraTabProps) {
  const router = useRouter()
  const { usuario } = useAuth()
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionTrabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState<number | null>(null)
  const [dialogAsignar, setDialogAsignar] = useState(false)

  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    trabajadorId: 0,
    cargoEnObra: ''
  })

  const [dialogCambiarCargo, setDialogCambiarCargo] = useState(false)
  const [nuevoCargo, setNuevoCargo] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [obraId])

  const cargarDatos = async () => {
    try {
      // Cargar todos los trabajadores
      let trabajadoresData = await trabajadoresService.getAll()

      // Filtrar por obras asignadas al usuario si corresponde
      if (usuario?.obras_asignadas && usuario.obras_asignadas.length > 0) {
        // Obtener IDs de trabajadores asignados a las obras del usuario
        const { data: asignaciones } = await supabase
          .from('trabajadores_obras')
          .select('trabajador_id')
          .in('obra_id', usuario.obras_asignadas)
          .eq('activo', true)

        const trabajadorIds = new Set(asignaciones?.map(a => a.trabajador_id) || [])
        trabajadoresData = trabajadoresData.filter(t => trabajadorIds.has(t.id))
      }

      setTrabajadores(trabajadoresData)

      // Cargar asignaciones de esta obra con JOIN a trabajadores
      const { data: asignacionesData } = await supabase
        .from('trabajadores_obras')
        .select(`
          *,
          trabajadores (*)
        `)
        .eq('obra_id', obraId)
        .order('fecha_asignacion', { ascending: false })

      if (asignacionesData) {
        setAsignaciones(asignacionesData as AsignacionTrabajador[])
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const trabajadoresActivos = asignaciones.filter(a => a.activo)
  
  const trabajadorDetalle = trabajadorSeleccionado 
    ? trabajadores.find(t => t.id === trabajadorSeleccionado)
    : null
    
  const asignacionDetalle = trabajadorSeleccionado
    ? asignaciones.find(a => a.trabajador_id === trabajadorSeleccionado && a.activo)
    : null

  const trabajadoresDisponibles = trabajadores.filter(t => 
    !asignaciones.some(a => a.trabajador_id === t.id && a.activo)
  )

  const handleAsignar = () => {
    if (!nuevaAsignacion.trabajadorId || !nuevaAsignacion.cargoEnObra) {
      alert('Selecciona trabajador y cargo')
      return
    }
    onAsignar(nuevaAsignacion.trabajadorId, nuevaAsignacion.cargoEnObra)
    setNuevaAsignacion({ trabajadorId: 0, cargoEnObra: '' })
    setDialogAsignar(false)
    
    // Recargar datos después de asignar
    setTimeout(() => cargarDatos(), 500)
  }

  const handleRetirar = (trabajadorId: number) => {
    const trabajador = trabajadores.find(t => t.id === trabajadorId)
    if (!trabajador) return
    
    if (confirm(`¿Retirar a ${trabajador.nombre} de esta obra?`)) {
      onRetirar(trabajadorId)
      setTrabajadorSeleccionado(null)
      
      // Recargar datos después de retirar
      setTimeout(() => cargarDatos(), 500)
    }
  }

  const handleCambiarCargo = async () => {
    if (!trabajadorSeleccionado || !nuevoCargo.trim()) {
      alert('Ingresa el nuevo cargo')
      return
    }

    try {
      const { error } = await supabase
        .from('trabajadores_obras')
        .update({ cargo_en_obra: nuevoCargo })
        .eq('obra_id', obraId)
        .eq('trabajador_id', trabajadorSeleccionado)
        .eq('activo', true)

      if (error) throw error

      setDialogCambiarCargo(false)
      setNuevoCargo('')
      
      // Recargar datos
      await cargarDatos()
      
      alert('Cargo actualizado correctamente')
    } catch (error) {
      console.error('Error al cambiar cargo:', error)
      alert('Error al cambiar el cargo')
    }
  }

  const getEstadoColor = (estado: Trabajador['estado']) => ({
    'activo': 'bg-green-100 text-green-800',
    'vacaciones': 'bg-blue-100 text-blue-800',
    'licencia': 'bg-yellow-100 text-yellow-800',
    'retirado': 'bg-gray-100 text-gray-800'
  }[estado])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-20rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando trabajadores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-20rem)] overflow-hidden">
      {/* LISTA IZQUIERDA - 380px */}
      <div className="w-[380px] border-r bg-gray-50 flex-shrink-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Trabajadores Asignados</h3>
            <Badge>{trabajadoresActivos.length}</Badge>
          </div>
          <Button 
            size="sm" 
            className="w-full text-white"
            style={{ backgroundColor: '#0066cc' }}
            onClick={() => setDialogAsignar(true)}
          >
            <Plus className="h-4 w-4 mr-2" />Asignar Trabajador
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {trabajadoresActivos.length > 0 ? (
            trabajadoresActivos.map((asignacion) => {
              const trabajador = asignacion.trabajadores || trabajadores.find(t => t.id === asignacion.trabajador_id)
              if (!trabajador) return null
              
              const isSelected = trabajadorSeleccionado === trabajador.id
              
              return (
                <Card 
                  key={asignacion.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setTrabajadorSeleccionado(trabajador.id)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      {trabajador.foto ? (
                        <img 
                          src={trabajador.foto} 
                          alt={trabajador.nombre} 
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0" 
                        />
                      ) : (
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm flex-shrink-0" 
                          style={{ backgroundColor: '#0066cc' }}
                        >
                          {trabajador.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{trabajador.nombre}</h4>
                        <p className="text-xs text-gray-600 truncate">{asignacion.cargo_en_obra}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Badge className="bg-blue-100 text-blue-800" style={{ fontSize: '9px' }}>
                            {trabajador.cargo}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#0066cc' }}></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">Sin trabajadores asignados</p>
                <Button 
                  size="sm"
                  onClick={() => setDialogAsignar(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />Asignar Primer Trabajador
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* DETALLE DERECHA - Flex */}
      <div className="flex-1 overflow-y-auto bg-white">
        {trabajadorDetalle && asignacionDetalle ? (
          <div className="p-6 space-y-6">
            {/* Header del trabajador */}
            <div className="flex items-start gap-4 pb-4 border-b">
              {trabajadorDetalle.foto ? (
                <img 
                  src={trabajadorDetalle.foto} 
                  alt={trabajadorDetalle.nombre} 
                  className="h-20 w-20 rounded-full object-cover" 
                />
              ) : (
                <div 
                  className="flex h-20 w-20 items-center justify-center rounded-full text-white font-bold text-2xl" 
                  style={{ backgroundColor: '#0066cc' }}
                >
                  {trabajadorDetalle.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{trabajadorDetalle.nombre}</h2>
                <p className="text-gray-600 mb-2">{trabajadorDetalle.cargo}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getEstadoColor(trabajadorDetalle.estado)}>
                    {trabajadorDetalle.estado}
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/trabajadores/${trabajadorDetalle.id}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Ficha Completa
              </Button>
            </div>

            {/* Info en esta obra */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" style={{ color: '#0066cc' }} />
                  Información en esta Obra
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-gray-500">Cargo en la Obra</Label>
                    <p className="font-medium">{asignacionDetalle.cargo_en_obra}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fecha de Asignación</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">
                        {new Date(asignacionDetalle.fecha_asignacion).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Estado en Obra</Label>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                  <div>
                    <Label className="text-gray-500">Días en Obra</Label>
                    <p className="font-medium">
                      {Math.floor(
                        (new Date().getTime() - new Date(asignacionDetalle.fecha_asignacion).getTime()) 
                        / (1000 * 60 * 60 * 24)
                      )} días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de contacto */}
            {trabajadorDetalle.telefono && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Contacto</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-gray-500">Teléfono</Label>
                      <p className="font-medium">{trabajadorDetalle.telefono}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acciones */}
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-red-600">Acciones</h3>
                <div className="space-y-2">
                  {/* Cambiar cargo */}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setNuevoCargo(asignacionDetalle?.cargo_en_obra || '')
                      setDialogCambiarCargo(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Cambiar Cargo en Obra
                  </Button>

                  {/* Retirar (destructivo) */}
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => handleRetirar(trabajadorDetalle.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Retirar de la Obra
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <div 
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" 
                style={{ backgroundColor: '#0066cc20' }}
              >
                <Users className="w-12 h-12" style={{ color: '#0066cc' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Selecciona un trabajador
              </h3>
              <p className="text-gray-500 text-sm">
                Haz clic en un trabajador de la lista para ver su información
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Asignar Trabajador */}
      <Dialog open={dialogAsignar} onOpenChange={setDialogAsignar}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Asignar Trabajador a Obra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Trabajador *</Label>
              <Select 
                value={nuevaAsignacion.trabajadorId.toString()} 
                onValueChange={(v) => setNuevaAsignacion({...nuevaAsignacion, trabajadorId: parseInt(v)})}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar trabajador..." /></SelectTrigger>
                <SelectContent>
                  {trabajadoresDisponibles.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.nombre} - {t.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trabajadoresDisponibles.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Todos los trabajadores ya están asignados a esta obra
                </p>
              )}
            </div>
            <div>
              <Label>Cargo en la Obra *</Label>
              <Input 
                placeholder="Ej: Jefe de Obra"
                value={nuevaAsignacion.cargoEnObra}
                onChange={(e) => setNuevaAsignacion({...nuevaAsignacion, cargoEnObra: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAsignar(false)}>Cancelar</Button>
            <Button 
              className="text-white" 
              style={{ backgroundColor: '#0066cc' }} 
              onClick={handleAsignar}
              disabled={trabajadoresDisponibles.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cambiar Cargo */}
      <Dialog open={dialogCambiarCargo} onOpenChange={setDialogCambiarCargo}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Cambiar Cargo en Obra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Trabajador</Label>
              <Input 
                value={trabajadorDetalle?.nombre || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Cargo Actual</Label>
              <Input 
                value={asignacionDetalle?.cargo_en_obra || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Nuevo Cargo *</Label>
              <Input 
                placeholder="Ej: Jefe de Cuadrilla"
                value={nuevoCargo}
                onChange={(e) => setNuevoCargo(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCambiarCargo(false)}>
              Cancelar
            </Button>
            <Button 
              className="text-white" 
              style={{ backgroundColor: '#0066cc' }} 
              onClick={handleCambiarCargo}
            >
              <Edit className="h-4 w-4 mr-2" />
              Actualizar Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
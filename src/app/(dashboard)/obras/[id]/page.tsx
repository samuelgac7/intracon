"use client"

import TrabajadoresObraTab from "@/components/TrabajadoresObraTab"
import AsistenciaObraTab from "@/components/AsistenciaObraTab"
import ConfirmDialog from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Building2, MapPin, DollarSign, Users, Calendar,
  TrendingUp, Clock, BarChart3, Activity, CheckCircle2,
  Plus, Package, FileText, ClipboardList, Upload, Download, File, PlusCircle
} from "lucide-react"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { obrasService } from "@/services/obras"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/toast"
import type { Obra } from "@/lib/supabase"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface DocumentoObra {
  id: number
  obra_id: number
  nombre: string
  tipo: string
  archivo: string
  fecha_subida: string
  tamanio: number
}

interface Gasto {
  id: number
  obra_id: number
  concepto: string
  monto: number
  fecha: string
  categoria: 'materiales' | 'mano-obra' | 'equipos' | 'servicios' | 'otros'
}

interface Hito {
  id: number
  obra_id: number
  nombre: string
  fecha_planificada: string
  fecha_real?: string
  completado: boolean
  descripcion?: string
}

interface BitacoraEntrada {
  id: number
  obra_id: number
  fecha: string
  titulo: string
  descripcion: string
  clima?: 'soleado' | 'nublado' | 'lluvia' | 'viento'
  temperatura?: number
  trabajadores_presentes?: number
  autor: string
}

interface Material {
  id: number
  obra_id: number
  nombre: string
  cantidad: number
  unidad: string
  stock_minimo: number
  ubicacion?: string
}

export default function ObraDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [obra, setObra] = useState<Obra | null>(null)
  const [obraId, setObraId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const previousObraRef = useRef<Obra | null>(null)
  const [tabActivo, setTabActivo] = useState('dashboard')
  
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [hitos, setHitos] = useState<Hito[]>([])
  const [bitacora, setBitacora] = useState<BitacoraEntrada[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  
  // Dialogs
  const [dialogGasto, setDialogGasto] = useState(false)
  const [dialogHito, setDialogHito] = useState(false)
  const [dialogBitacora, setDialogBitacora] = useState(false)
  const [dialogMaterial, setDialogMaterial] = useState(false)
  
  const [nuevoGasto, setNuevoGasto] = useState({
    concepto: '',
    monto: 0,
    categoria: 'materiales' as const
  })
  
  const [nuevoHito, setNuevoHito] = useState({
    nombre: '',
    fechaPlanificada: '',
    descripcion: ''
  })
  
  const [nuevaBitacora, setNuevaBitacora] = useState({
    titulo: '',
    descripcion: '',
    clima: 'soleado' as const,
    temperatura: 20,
    trabajadoresPresentes: 0
  })
  
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    cantidad: 0,
    unidad: 'unidad',
    stockMinimo: 0,
    ubicacion: ''
  })

  const [confirmCambioObra, setConfirmCambioObra] = useState(false)
  const [obraAnteriorNombre, setObraAnteriorNombre] = useState('')
  const [trabajadorPendiente, setTrabajadorPendiente] = useState<{id: number, cargo: string} | null>(null)

  useEffect(() => {
    params.then(p => setObraId(p.id))
  }, [params])

  useEffect(() => {
    if (!obraId) return
    cargarDatos()
  }, [obraId])

  const cargarDatos = async () => {
    if (!obraId) return

    // Guardar obra anterior para mostrar durante la transición
    if (obra) {
      previousObraRef.current = obra
    }

    // Solo mostrar skeleton completo en la primera carga absoluta
    const esPrimeraCarga = obra === null && previousObraRef.current === null

    try {
      if (esPrimeraCarga) {
        setLoading(true)
      }

      // Cargar todos los datos en paralelo para máxima velocidad
      const [
        data,
        docsData,
        gastosData,
        bitacoraData,
        materialesData
      ] = await Promise.all([
        obrasService.getById(parseInt(obraId)),
        supabase.from('documentos_obra').select('*').eq('obra_id', parseInt(obraId)).order('fecha_subida', { ascending: false }),
        supabase.from('gastos').select('*').eq('obra_id', parseInt(obraId)).order('fecha', { ascending: false }),
        supabase.from('bitacora').select('*').eq('obra_id', parseInt(obraId)).order('fecha', { ascending: false }),
        supabase.from('materiales').select('*').eq('obra_id', parseInt(obraId)).order('nombre', { ascending: true })
      ])

      // Actualizar todo el estado de una vez usando startTransition
      startTransition(() => {
        setObra(data)
        if (docsData.data) setDocumentos(docsData.data)
        if (gastosData.data) setGastos(gastosData.data)
        if (bitacoraData.data) setBitacora(bitacoraData.data)
        if (materialesData.data) setMateriales(materialesData.data)
      })

    } catch (error: any) {
      console.error('Error:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo cargar la obra"
      })
    } finally {
      setLoading(false)
    }
  }

  const guardarObra = async (obraActualizada: Obra) => {
    try {
      await obrasService.update(obraActualizada.id, obraActualizada)
      setObra(obraActualizada)
      addToast({
        type: "success",
        title: "Guardado",
        description: "Cambios guardados correctamente"
      })
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo guardar"
      })
    }
  }

  const actualizarProgreso = (progreso: number) => {
    if (!obra) return
    guardarObra({ ...obra, progreso })
  }

  const cambiarEstado = (estado: Obra['estado']) => {
    if (!obra) return
    guardarObra({ ...obra, estado })
  }

  const agregarGasto = async () => {
    if (!obra || !nuevoGasto.concepto || nuevoGasto.monto <= 0) {
      addToast({
        type: "warning",
        title: "Faltan datos",
        description: "Completa todos los campos del gasto"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert([{
          obra_id: obra.id,
          concepto: nuevoGasto.concepto,
          monto: nuevoGasto.monto,
          categoria: nuevoGasto.categoria
        }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setGastos([data, ...gastos])
        setNuevoGasto({ concepto: '', monto: 0, categoria: 'materiales' })
        setDialogGasto(false)
        addToast({
          type: "success",
          title: "Gasto registrado",
          description: "Gasto agregado exitosamente"
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo registrar el gasto"
      })
    }
  }

  const agregarHito = async () => {
    if (!obra || !nuevoHito.nombre || !nuevoHito.fechaPlanificada) {
      addToast({
        type: "warning",
        title: "Faltan datos",
        description: "Completa nombre y fecha del hito"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('hitos')
        .insert([{
          obra_id: obra.id,
          nombre: nuevoHito.nombre,
          fecha_planificada: nuevoHito.fechaPlanificada,
          completado: false,
          descripcion: nuevoHito.descripcion || undefined
        }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setHitos([...hitos, data].sort((a, b) => 
          new Date(a.fecha_planificada).getTime() - new Date(b.fecha_planificada).getTime()
        ))
        setNuevoHito({ nombre: '', fechaPlanificada: '', descripcion: '' })
        setDialogHito(false)
        addToast({
          type: "success",
          title: "Hito agregado",
          description: "Hito creado exitosamente"
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo agregar el hito"
      })
    }
  }

  const toggleHito = async (hitoId: number) => {
    const hito = hitos.find(h => h.id === hitoId)
    if (!hito) return

    try {
      const { error } = await supabase
        .from('hitos')
        .update({
          completado: !hito.completado,
          fecha_real: !hito.completado ? new Date().toISOString() : null
        })
        .eq('id', hitoId)

      if (error) throw error

      setHitos(hitos.map(h => 
        h.id === hitoId 
          ? { ...h, completado: !h.completado, fecha_real: !h.completado ? new Date().toISOString() : undefined }
          : h
      ))
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo actualizar el hito"
      })
    }
  }

  const agregarBitacora = async () => {
    if (!obra || !nuevaBitacora.titulo || !nuevaBitacora.descripcion) {
      addToast({
        type: "warning",
        title: "Faltan datos",
        description: "Completa título y descripción"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('bitacora')
        .insert([{
          obra_id: obra.id,
          titulo: nuevaBitacora.titulo,
          descripcion: nuevaBitacora.descripcion,
          clima: nuevaBitacora.clima,
          temperatura: nuevaBitacora.temperatura,
          trabajadores_presentes: nuevaBitacora.trabajadoresPresentes,
          autor: 'Admin'
        }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setBitacora([data, ...bitacora])
        setNuevaBitacora({ titulo: '', descripcion: '', clima: 'soleado', temperatura: 20, trabajadoresPresentes: 0 })
        setDialogBitacora(false)
        addToast({
          type: "success",
          title: "Entrada registrada",
          description: "Bitácora actualizada"
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo registrar la entrada"
      })
    }
  }

  const agregarMaterial = async () => {
    if (!obra || !nuevoMaterial.nombre || nuevoMaterial.cantidad <= 0) {
      addToast({
        type: "warning",
        title: "Faltan datos",
        description: "Completa nombre y cantidad"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('materiales')
        .insert([{
          obra_id: obra.id,
          nombre: nuevoMaterial.nombre,
          cantidad: nuevoMaterial.cantidad,
          unidad: nuevoMaterial.unidad,
          stock_minimo: nuevoMaterial.stockMinimo,
          ubicacion: nuevoMaterial.ubicacion || undefined
        }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setMateriales([...materiales, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        setNuevoMaterial({ nombre: '', cantidad: 0, unidad: 'unidad', stockMinimo: 0, ubicacion: '' })
        setDialogMaterial(false)
        addToast({
          type: "success",
          title: "Material agregado",
          description: "Material registrado exitosamente"
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo agregar el material"
      })
    }
  }

  const asignarTrabajador = async (trabajadorId: number, cargoEnObra: string) => {
    if (!obra) return

    // Verificar si el trabajador ya tiene una obra asignada
    const obraActual = await obrasService.getObraActualTrabajador(trabajadorId)

    if (obraActual && obraActual.id !== obra.id) {
      // Mostrar diálogo de confirmación personalizado
      setObraAnteriorNombre(obraActual.nombre)
      setTrabajadorPendiente({ id: trabajadorId, cargo: cargoEnObra })
      setConfirmCambioObra(true)
    } else {
      // Si no tiene obra actual o es la misma obra, asignar directamente
      await ejecutarAsignacion(trabajadorId, cargoEnObra, null)
    }
  }

  const ejecutarAsignacion = async (trabajadorId: number, cargoEnObra: string, obraActualNombre: string | null) => {
    if (!obra) return

    try {
      await obrasService.asignarTrabajador(obra.id, trabajadorId, cargoEnObra)

      addToast({
        type: "success",
        title: obraActualNombre ? "Trabajador cambiado de obra" : "Trabajador asignado",
        description: obraActualNombre
          ? `El trabajador fue cambiado de "${obraActualNombre}" a "${obra.nombre}". Recuerda subir el Anexo de Cambio de Obra.`
          : "Asignación realizada exitosamente"
      })

      // Recargar datos
      cargarDatos()
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || ''

      addToast({
        type: "error",
        title: "Error",
        description: errorMessage || "No se pudo asignar el trabajador"
      })
      console.error('Error asignando trabajador:', error)
    }
  }

  const retirarTrabajador = async (trabajadorId: number) => {
    if (!obra) return

    try {
      const { error } = await supabase
        .from('trabajadores_obras')
        .update({
          activo: false,
          fecha_retiro: new Date().toISOString()
        })
        .eq('trabajador_id', trabajadorId)
        .eq('obra_id', obra.id)

      if (error) throw error

      addToast({
        type: "success",
        title: "Trabajador retirado",
        description: "Trabajador retirado de la obra"
      })
      
      // Recargar datos
      cargarDatos()
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo retirar el trabajador"
      })
    }
  }

  const handleDocumentoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && obra) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: "error",
          title: "Archivo muy grande",
          description: "El archivo no puede superar 5MB"
        })
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const { data, error } = await supabase
            .from('documentos_obra')
            .insert([{
              obra_id: obra.id,
              nombre: file.name,
              tipo: 'otro',
              archivo: reader.result as string,
              tamanio: file.size
            }])
            .select()
            .single()

          if (error) throw error
          
          if (data) {
            setDocumentos([data, ...documentos])
            addToast({
              type: "success",
              title: "Documento subido",
              description: file.name
            })
          }
        } catch (error: any) {
          addToast({
            type: "error",
            title: "Error",
            description: "No se pudo subir el documento"
          })
        }
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const calcularKPIs = () => {
    if (!obra) return { presupuestoNum: 0, gastosTotal: 0, balance: 0, eficiencia: 0, diasTranscurridos: 0, trabajadoresActivos: 0 }

    const presupuestoNum = obra.monto_contrato || 0
    const gastosTotal = gastos.reduce((sum, g) => sum + g.monto, 0)
    const balance = presupuestoNum - gastosTotal
    const eficiencia = presupuestoNum > 0 ? ((balance / presupuestoNum) * 100) : 0
    
    const fechaInicio = new Date(obra.fecha_inicio)
    const fechaActual = new Date()
    const diasTranscurridos = Math.floor((fechaActual.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      presupuestoNum,
      gastosTotal,
      balance,
      eficiencia,
      diasTranscurridos,
      trabajadoresActivos: 0 // Se calculará con las asignaciones
    }
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando obra...</p>
        </div>
      </div>
    )
  }

  if (!obra) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Obra no encontrada</p>
          <Button className="mt-4" onClick={() => router.push('/obras')}>
            Volver a Obras
          </Button>
        </div>
      </div>
    )
  }

  const kpis = calcularKPIs()

  return (
    <div className="min-h-screen bg-gray-50 transition-opacity duration-150" style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* HEADER FIJO */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <button onClick={() => router.push('/obras')} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Obras
            </button>
            <span>/</span>
            <span className="font-medium text-gray-900">{obra.nombre}</span>
          </div>

          {/* Info principal */}
          <div className="flex items-start gap-4">
            {obra.foto ? (
              <img src={obra.foto} alt={obra.nombre} className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg" style={{ backgroundColor: '#0066cc20' }}>
                <Building2 className="h-10 w-10" style={{ color: '#0066cc' }} />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{obra.nombre}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {obra.cliente}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {obra.direccion}, {obra.comuna}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(obra.fecha_inicio).toLocaleDateString('es-CL')}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge className={getEstadoColor(obra.estado)}>{getEstadoTexto(obra.estado)}</Badge>
                {kpis.balance < 0 && (
                  <Badge variant="destructive">¡Sobrepresupuesto!</Badge>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setDialogGasto(true)}>
                <DollarSign className="h-4 w-4 mr-1" />Gasto
              </Button>
              <Button size="sm" onClick={() => setDialogBitacora(true)}>
                <ClipboardList className="h-4 w-4 mr-1" />Bitácora
              </Button>
            </div>
          </div>
        </div>

        {/* TABS NAVEGACIÓN */}
        <Tabs value={tabActivo} onValueChange={setTabActivo} className="w-full">
          <TabsList className="w-full justify-start h-auto px-6 bg-gray-50 rounded-none border-t">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white">Dashboard</TabsTrigger>
            <TabsTrigger value="trabajadores" className="data-[state=active]:bg-white">
              Trabajadores
            </TabsTrigger>
            <TabsTrigger value="asistencia" className="data-[state=active]:bg-white">Asistencia</TabsTrigger>
            <TabsTrigger value="presupuesto" className="data-[state=active]:bg-white">Presupuesto</TabsTrigger>
            <TabsTrigger value="cronograma" className="data-[state=active]:bg-white">Cronograma</TabsTrigger>
            <TabsTrigger value="bitacora" className="data-[state=active]:bg-white">
              Bitácora ({bitacora.length})
            </TabsTrigger>
            <TabsTrigger value="materiales" className="data-[state=active]:bg-white">Materiales</TabsTrigger>
            <TabsTrigger value="documentos" className="data-[state=active]:bg-white">
              Documentos ({documentos.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <Tabs value={tabActivo} className="w-full">
        {/* TAB DASHBOARD */}
        <TabsContent value="dashboard" className="p-6 space-y-6 mt-0">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Progreso</p>
                    <p className="text-3xl font-bold" style={{ color: '#0066cc' }}>{obra.progreso}%</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Días transcurridos</p>
                    <p className="text-3xl font-bold">{kpis.diasTranscurridos}</p>
                  </div>
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Trabajadores</p>
                    <p className="text-3xl font-bold">{kpis.trabajadoresActivos}</p>
                  </div>
                  <Users className="h-10 w-10 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Eficiencia</p>
                    <p className={`text-3xl font-bold ${kpis.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpis.eficiencia.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className={`h-10 w-10 ${kpis.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Distribución Presupuestaria</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center" style={{ height: '350px' }}>
                <Doughnut
                  data={{
                    labels: ['Gastado', 'Disponible'],
                    datasets: [{
                      data: [kpis.gastosTotal, Math.max(0, kpis.balance)],
                      backgroundColor: ['#ef4444', '#10b981'],
                      borderWidth: 3,
                      borderColor: '#fff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { font: { size: 14 } } },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: $${context.parsed.toLocaleString()}`
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Gastos por Categoría</CardTitle></CardHeader>
              <CardContent style={{ height: '350px' }}>
                {(() => {
                  const gastosPorCategoria = gastos.reduce((acc, g) => {
                    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto
                    return acc
                  }, {} as Record<string, number>)
                  
                  const categorias = Object.keys(gastosPorCategoria)
                  const montos = Object.values(gastosPorCategoria)

                  return categorias.length > 0 ? (
                    <Bar
                      data={{
                        labels: categorias.map(c => c.replace('-', ' ')),
                        datasets: [{
                          label: 'Gastos',
                          data: montos,
                          backgroundColor: '#0066cc',
                          borderRadius: 8
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `$${(context.parsed.y as number).toLocaleString()}`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `$${(value as number).toLocaleString()}`
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p>Sin datos de gastos</p>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Control de progreso */}
          <Card>
            <CardHeader><CardTitle>Control de Progreso y Estado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Progreso de obra</span>
                  <span className="font-semibold text-xl" style={{ color: '#0066cc' }}>{obra.progreso}%</span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={obra.progreso}
                  onChange={(e) => actualizarProgreso(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="mb-2 block">Cambiar Estado</Label>
                <div className="flex gap-2 flex-wrap">
                  {(['planificacion', 'en-progreso', 'pausada', 'terminada', 'cancelada'] as const).map(estado => (
                    <Button
                      key={estado}
                      size="sm"
                      variant={obra.estado === estado ? 'default' : 'outline'}
                      onClick={() => cambiarEstado(estado)}
                      style={obra.estado === estado ? { backgroundColor: '#0066cc', color: 'white' } : {}}
                    >
                      {getEstadoTexto(estado)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen financiero */}
          <Card>
            <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Presupuesto Total</p>
                  <p className="text-2xl font-bold">${kpis.presupuestoNum.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Gastado</p>
                  <p className="text-2xl font-bold text-red-600">${kpis.gastosTotal.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Disponible</p>
                  <p className={`text-2xl font-bold ${kpis.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${kpis.balance.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-4 transition-all"
                    style={{ 
                      width: `${Math.min((kpis.gastosTotal / kpis.presupuestoNum) * 100, 100)}%`,
                      backgroundColor: kpis.balance >= 0 ? '#10b981' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB TRABAJADORES */}
        <TabsContent value="trabajadores" className="mt-0">
          <TrabajadoresObraTab
            obraId={obra.id}
            trabajadoresAsignados={[]}
            onAsignar={asignarTrabajador}
            onRetirar={retirarTrabajador}
          />
        </TabsContent>

        {/* TAB ASISTENCIA */}
        <TabsContent value="asistencia" className="mt-0">
          <AsistenciaObraTab
            obraId={obra.id}
            nombreObra={obra.nombre}
          />
        </TabsContent>

        {/* TAB PRESUPUESTO */}
        <TabsContent value="presupuesto" className="p-6 space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registro de Gastos</CardTitle>
              <Button size="sm" onClick={() => setDialogGasto(true)}>
                <Plus className="h-4 w-4 mr-1" />Nuevo Gasto
              </Button>
            </CardHeader>
            <CardContent>
              {gastos.length > 0 ? (
                <div className="space-y-3">
                  {gastos.map((gasto) => (
                    <div key={gasto.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <DollarSign className="h-10 w-10 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">{gasto.concepto}</p>
                        <div className="flex gap-3 text-sm text-gray-500 mt-1">
                          <Badge variant="outline">{gasto.categoria.replace('-', ' ')}</Badge>
                          <span>{new Date(gasto.fecha).toLocaleDateString('es-CL')}</span>
                        </div>
                      </div>
                      <p className="font-bold text-xl text-red-600">${gasto.monto.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Sin gastos registrados</p>
                  <Button onClick={() => setDialogGasto(true)}>
                    <Plus className="h-4 w-4 mr-2" />Registrar Primer Gasto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CRONOGRAMA */}
        <TabsContent value="cronograma" className="p-6 space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hitos del Proyecto</CardTitle>
              <Button size="sm" onClick={() => setDialogHito(true)}>
                <Plus className="h-4 w-4 mr-1" />Nuevo Hito
              </Button>
            </CardHeader>
            <CardContent>
              {hitos.length > 0 ? (
                <div className="space-y-4">
                  {hitos.map((hito, index) => (
                    <div key={hito.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => toggleHito(hito.id)}
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                            hito.completado ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        >
                          {hito.completado ? (
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-white" />
                          )}
                        </button>
                        {index < hitos.length - 1 && (
                          <div className={`w-0.5 h-20 ${hito.completado ? 'bg-green-500' : 'bg-gray-300'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-lg">{hito.nombre}</p>
                            {hito.descripcion && (
                              <p className="text-sm text-gray-600 mt-1">{hito.descripcion}</p>
                            )}
                            <div className="flex gap-4 text-sm text-gray-500 mt-2">
                              <span>📅 Planificado: {new Date(hito.fecha_planificada).toLocaleDateString('es-CL')}</span>
                              {hito.fecha_real && (
                                <span>✅ Completado: {new Date(hito.fecha_real).toLocaleDateString('es-CL')}</span>
                              )}
                            </div>
                          </div>
                          <Badge className={hito.completado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {hito.completado ? 'Completado' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Sin hitos definidos</p>
                  <Button onClick={() => setDialogHito(true)}>
                    <Plus className="h-4 w-4 mr-2" />Agregar Primer Hito
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB BITÁCORA */}
        <TabsContent value="bitacora" className="p-6 space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bitácora de Obra</CardTitle>
              <Button size="sm" onClick={() => setDialogBitacora(true)}>
                <Plus className="h-4 w-4 mr-1" />Nueva Entrada
              </Button>
            </CardHeader>
            <CardContent>
              {bitacora.length > 0 ? (
                <div className="space-y-4">
                  {bitacora.map((entrada) => (
                    <Card key={entrada.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{entrada.titulo}</h4>
                            <div className="flex gap-3 text-sm text-gray-500 mt-1">
                              <span>📅 {new Date(entrada.fecha).toLocaleDateString('es-CL')}</span>
                              <span>🕕 {new Date(entrada.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                              {entrada.clima && (
                                <Badge variant="outline">
                                  {entrada.clima === 'soleado' ? '☀️' : entrada.clima === 'nublado' ? '☁️' : entrada.clima === 'lluvia' ? '🌧️' : '💨'} {entrada.clima}
                                </Badge>
                              )}
                              {entrada.temperatura && <span>🌡️ {entrada.temperatura}°C</span>}
                            </div>
                          </div>
                          {entrada.trabajadores_presentes !== undefined && entrada.trabajadores_presentes > 0 && (
                            <Badge><Users className="h-3 w-3 mr-1" />{entrada.trabajadores_presentes}</Badge>
                          )}
                        </div>
                        <p className="text-gray-700">{entrada.descripcion}</p>
                        <p className="text-xs text-gray-500 mt-3">✏️ Por: {entrada.autor}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Sin entradas en la bitácora</p>
                  <Button onClick={() => setDialogBitacora(true)}>
                    <Plus className="h-4 w-4 mr-2" />Crear Primera Entrada
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB MATERIALES */}
        <TabsContent value="materiales" className="p-6 space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventario de Materiales</CardTitle>
              <Button size="sm" onClick={() => setDialogMaterial(true)}>
                <Plus className="h-4 w-4 mr-1" />Agregar Material
              </Button>
            </CardHeader>
            <CardContent>
              {materiales.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {materiales.map((material) => (
                    <Card key={material.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Package className="h-10 w-10 text-orange-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{material.nombre}</p>
                            <p className="text-sm text-gray-500">{material.ubicacion || 'Sin ubicación'}</p>
                            {material.cantidad <= material.stock_minimo && (
                              <Badge variant="destructive" className="text-xs mt-1">⚠️ Stock bajo</Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Cantidad:</span>
                            <span className="font-bold">{material.cantidad} {material.unidad}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-500">Mínimo:</span>
                            <span className="text-sm">{material.stock_minimo} {material.unidad}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Sin materiales registrados</p>
                  <Button onClick={() => setDialogMaterial(true)}>
                    <Plus className="h-4 w-4 mr-2" />Agregar Primer Material
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB DOCUMENTOS */}
        <TabsContent value="documentos" className="p-6 space-y-4 mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos de la Obra</CardTitle>
              <div>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                  onChange={handleDocumentoChange} 
                  className="hidden" 
                  id="doc-upload-obra"
                />
                <Button 
                  size="sm"
                  onClick={() => document.getElementById('doc-upload-obra')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />Subir Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {documentos.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-3">
                          <File className="h-10 w-10 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.nombre}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              <p>{formatBytes(doc.tamanio)}</p>
                              <p>{new Date(doc.fecha_subida).toLocaleDateString('es-CL')}</p>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = doc.archivo
                            link.download = doc.nombre
                            link.click()
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />Descargar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="mb-4">Sin documentos adjuntos</p>
                  <Button onClick={() => document.getElementById('doc-upload-obra')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />Subir Primer Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <Dialog open={dialogGasto} onOpenChange={setDialogGasto}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Registrar Gasto</DialogTitle>
            <DialogDescription>
              Registra un nuevo gasto asociado a esta obra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Concepto *</Label>
              <Input 
                placeholder="Ej: Cemento Portland 50kg"
                value={nuevoGasto.concepto}
                onChange={(e) => setNuevoGasto({...nuevoGasto, concepto: e.target.value})}
              />
            </div>
            <div>
              <Label>Monto *</Label>
              <Input 
                type="number"
                placeholder="0"
                value={nuevoGasto.monto || ''}
                onChange={(e) => setNuevoGasto({...nuevoGasto, monto: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={nuevoGasto.categoria} onValueChange={(v: any) => setNuevoGasto({...nuevoGasto, categoria: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="materiales">Materiales</SelectItem>
                  <SelectItem value="mano-obra">Mano de Obra</SelectItem>
                  <SelectItem value="equipos">Equipos</SelectItem>
                  <SelectItem value="servicios">Servicios</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogGasto(false)}>Cancelar</Button>
            <Button className="text-white" style={{ backgroundColor: '#0066cc' }} onClick={agregarGasto}>
              <PlusCircle className="h-4 w-4 mr-2" />Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogHito} onOpenChange={setDialogHito}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Agregar Hito</DialogTitle>
            <DialogDescription>
              Crea un nuevo hito para hacer seguimiento del progreso de la obra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Hito *</Label>
              <Input 
                placeholder="Ej: Fundaciones completadas"
                value={nuevoHito.nombre}
                onChange={(e) => setNuevoHito({...nuevoHito, nombre: e.target.value})}
              />
            </div>
            <div>
              <Label>Fecha Planificada *</Label>
              <Input 
                type="date"
                value={nuevoHito.fechaPlanificada}
                onChange={(e) => setNuevoHito({...nuevoHito, fechaPlanificada: e.target.value})}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea 
                placeholder="Detalles del hito..."
                value={nuevoHito.descripcion}
                onChange={(e) => setNuevoHito({...nuevoHito, descripcion: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHito(false)}>Cancelar</Button>
            <Button className="text-white" style={{ backgroundColor: '#0066cc' }} onClick={agregarHito}>
              <PlusCircle className="h-4 w-4 mr-2" />Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogBitacora} onOpenChange={setDialogBitacora}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nueva Entrada de Bitácora</DialogTitle>
            <DialogDescription>
              Registra una nueva entrada en la bitácora de la obra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input 
                placeholder="Ej: Inicio de excavación"
                value={nuevaBitacora.titulo}
                onChange={(e) => setNuevaBitacora({...nuevaBitacora, titulo: e.target.value})}
              />
            </div>
            <div>
              <Label>Descripción *</Label>
              <Textarea 
                placeholder="Describe las actividades del día..."
                value={nuevaBitacora.descripcion}
                onChange={(e) => setNuevaBitacora({...nuevaBitacora, descripcion: e.target.value})}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Clima</Label>
                <Select value={nuevaBitacora.clima} onValueChange={(v: any) => setNuevaBitacora({...nuevaBitacora, clima: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soleado">☀️ Soleado</SelectItem>
                    <SelectItem value="nublado">☁️ Nublado</SelectItem>
                    <SelectItem value="lluvia">🌧️ Lluvia</SelectItem>
                    <SelectItem value="viento">💨 Viento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temp. (°C)</Label>
                <Input 
                  type="number"
                  value={nuevaBitacora.temperatura}
                  onChange={(e) => setNuevaBitacora({...nuevaBitacora, temperatura: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Trabajadores</Label>
                <Input 
                  type="number"
                  value={nuevaBitacora.trabajadoresPresentes}
                  onChange={(e) => setNuevaBitacora({...nuevaBitacora, trabajadoresPresentes: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBitacora(false)}>Cancelar</Button>
            <Button className="text-white" style={{ backgroundColor: '#0066cc' }} onClick={agregarBitacora}>
              <PlusCircle className="h-4 w-4 mr-2" />Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMaterial} onOpenChange={setDialogMaterial}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Agregar Material</DialogTitle>
            <DialogDescription>
              Registra un nuevo material utilizado en la obra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Material *</Label>
              <Input 
                placeholder="Ej: Cemento Portland"
                value={nuevoMaterial.nombre}
                onChange={(e) => setNuevoMaterial({...nuevoMaterial, nombre: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cantidad *</Label>
                <Input 
                  type="number"
                  value={nuevoMaterial.cantidad || ''}
                  onChange={(e) => setNuevoMaterial({...nuevoMaterial, cantidad: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Unidad</Label>
                <Input 
                  placeholder="kg, m3, unidad..."
                  value={nuevoMaterial.unidad}
                  onChange={(e) => setNuevoMaterial({...nuevoMaterial, unidad: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Stock Mínimo</Label>
              <Input 
                type="number"
                value={nuevoMaterial.stockMinimo || ''}
                onChange={(e) => setNuevoMaterial({...nuevoMaterial, stockMinimo: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input 
                placeholder="Ej: Bodega A"
                value={nuevoMaterial.ubicacion}
                onChange={(e) => setNuevoMaterial({...nuevoMaterial, ubicacion: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMaterial(false)}>Cancelar</Button>
            <Button className="text-white" style={{ backgroundColor: '#0066cc' }} onClick={agregarMaterial}>
              <PlusCircle className="h-4 w-4 mr-2" />Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para cambio de obra */}
      <ConfirmDialog
        open={confirmCambioObra}
        onOpenChange={setConfirmCambioObra}
        title="Cambio de Obra"
        description={`El trabajador está actualmente asignado a "${obraAnteriorNombre}". ¿Deseas cambiarlo a "${obra?.nombre}"?`}
        warningMessage="Deberás subir un Anexo de Cambio de Obra en la sección de documentos del trabajador."
        confirmText="Aceptar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={() => {
          if (trabajadorPendiente) {
            ejecutarAsignacion(trabajadorPendiente.id, trabajadorPendiente.cargo, obraAnteriorNombre)
            setTrabajadorPendiente(null)
          }
        }}
      />
    </div>
  )
}
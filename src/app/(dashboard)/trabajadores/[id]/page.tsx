"use client"

import TrabajadoresList from "@/components/TrabajadoresList"
import TabContratos from "@/components/TabContratos"
import ConfirmDialog from "@/components/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  X, Shield, Star, History, FileText, Upload, Download, Trash2, Printer,
  Users, Building2, Calendar, Mail, Phone, MapPin, Briefcase,
  AlertCircle, CheckCircle, Clock, FileCheck, UserCog, ChevronRight, Edit, User, ChevronDown
} from "lucide-react"
import { trabajadoresService } from "@/services/trabajadores"
import { obrasService } from "@/services/obras"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/toast"
import type { Trabajador } from "@/lib/supabase"
import { formatearRut, validarRut } from "@/lib/utils"

interface DocumentoTrabajador {
  id: number
  trabajador_id: number
  obra_id?: number
  nombre: string
  tipo: string
  archivo: string
  fecha_subida: string
  tamanio: number
  descripcion?: string
  estado_validacion?: string
}

interface Evaluacion {
  id: number
  trabajador_id: number
  fecha: string
  tipo: string
  puntaje: number
  comentarios: string
  evaluador: string
}

interface HistorialCambio {
  id: number
  trabajador_id: number
  fecha: string
  tipo: string
  campo: string
  valor_anterior?: string
  valor_nuevo?: string
  motivo?: string
  realizado_por?: number
}

interface ObraConAsignacion {
  id: number
  nombre: string
  cliente: string
  estado: string
  fecha_asignacion: string
  fecha_retiro?: string
  cargo_en_obra: string
  activo: boolean
}

export default function TrabajadorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [trabajador, setTrabajador] = useState<Trabajador | null>(null)
  const [trabajadorId, setTrabajadorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const previousTrabajadorRef = useRef<Trabajador | null>(null)
  const [tabActivo, setTabActivo] = useState('info')
  const [seccionPrevencionAbierta, setSeccionPrevencionAbierta] = useState(true)
  const [seccionesObrasAbiertas, setSeccionesObrasAbiertas] = useState<Set<number>>(new Set())

  const [dialogAsignarObra, setDialogAsignarObra] = useState(false)
  const [dialogCambiarEstado, setDialogCambiarEstado] = useState(false)
  const [dialogEditarTrabajador, setDialogEditarTrabajador] = useState(false)
  const [obrasDelTrabajador, setObrasDelTrabajador] = useState<ObraConAsignacion[]>([])
  const [todasLasObras, setTodasLasObras] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<DocumentoTrabajador[]>([])
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [historial, setHistorial] = useState<HistorialCambio[]>([])

  const [formEditarTrabajador, setFormEditarTrabajador] = useState({
    nombre: '',
    rut: '',
    cargo: '',
    telefono: '',
    email: '',
    direccion: '',
    fecha_ingreso: '',
    contrato: '',
    nivel: '',
    fecha_termino: ''
  })

  const [formAsignarObra, setFormAsignarObra] = useState({
    obra_id: '',
    cargo_en_obra: ''
  })

  const [confirmCambioObra, setConfirmCambioObra] = useState(false)
  const [obraAnteriorNombre, setObraAnteriorNombre] = useState('')
  const [obraNuevaNombre, setObraNuevaNombre] = useState('')

  useEffect(() => {
    params.then(p => setTrabajadorId(p.id))
  }, [params])

  useEffect(() => {
    if (!trabajadorId) return
    cargarDatos()
  }, [trabajadorId])

  const cargarDatos = async () => {
    if (!trabajadorId) return

    if (trabajador) {
      previousTrabajadorRef.current = trabajador
    }

    const esPrimeraCarga = trabajador === null && previousTrabajadorRef.current === null

    try {
      if (esPrimeraCarga) {
        setLoading(true)
      }

      const [
        data,
        obrasDataRaw,
        todasObras,
        docsData,
        evalData,
        histData
      ] = await Promise.all([
        trabajadoresService.getById(parseInt(trabajadorId)),
        supabase
          .from('trabajadores_obras')
          .select(`
            id,
            fecha_asignacion,
            fecha_retiro,
            cargo_en_obra,
            activo,
            obra_id,
            obras (
              id,
              nombre,
              cliente,
              estado
            )
          `)
          .eq('trabajador_id', parseInt(trabajadorId))
          .order('activo', { ascending: false })
          .order('fecha_asignacion', { ascending: false }),
        obrasService.getAll(),
        supabase.from('documentos_trabajador').select('*').eq('trabajador_id', parseInt(trabajadorId)).order('fecha_subida', { ascending: false }),
        supabase.from('evaluaciones').select('*').eq('trabajador_id', parseInt(trabajadorId)).order('fecha', { ascending: false }),
        supabase.from('historial_cambios').select('*').eq('trabajador_id', parseInt(trabajadorId)).order('fecha', { ascending: false }).limit(50)
      ])

      const obrasTransformadas: ObraConAsignacion[] = obrasDataRaw.data?.map((asig: any) => ({
        id: asig.obras.id,
        nombre: asig.obras.nombre,
        cliente: asig.obras.cliente,
        estado: asig.obras.estado,
        fecha_asignacion: asig.fecha_asignacion,
        fecha_retiro: asig.fecha_retiro,
        cargo_en_obra: asig.cargo_en_obra,
        activo: asig.activo
      })) || []

      startTransition(() => {
        setTrabajador(data)
        setObrasDelTrabajador(obrasTransformadas)
        setTodasLasObras(todasObras)
        if (docsData.data) setDocumentos(docsData.data)
        if (evalData.data) setEvaluaciones(evalData.data)
        if (histData.data) setHistorial(histData.data)
      })
    } catch (error: any) {
      console.error('Error:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo cargar el trabajador"
      })
    } finally {
      setLoading(false)
    }
  }

  const iniciarAsignacionObra = async () => {
    if (!trabajador || !formAsignarObra.obra_id || !formAsignarObra.cargo_en_obra) {
      addToast({
        type: "warning",
        title: "Faltan datos",
        description: "Selecciona una obra y un cargo"
      })
      return
    }

    const obraId = parseInt(formAsignarObra.obra_id)
    const obraNueva = todasLasObras.find(o => o.id === obraId)
    if (!obraNueva) return

    const obraActiva = obrasDelTrabajador.find(o => o.activo)

    if (obraActiva) {
      setObraAnteriorNombre(obraActiva.nombre)
      setObraNuevaNombre(obraNueva.nombre)
      setConfirmCambioObra(true)
    } else {
      await ejecutarAsignacion(obraId, obraNueva.nombre, null)
    }
  }

  const ejecutarAsignacion = async (obraId: number, obraNuevaNombre: string, obraActualNombre: string | null) => {
    if (!trabajador) return

    try {
      const cargo = formAsignarObra.cargo_en_obra

      await obrasService.asignarTrabajador(obraId, trabajador.id, cargo)

      await agregarHistorial('obra', `${obraActualNombre ? 'Cambiado' : 'Asignado'} a obra: ${obraNuevaNombre}`)

      setDialogAsignarObra(false)
      setFormAsignarObra({ obra_id: '', cargo_en_obra: '' })

      addToast({
        type: "success",
        title: obraActualNombre ? "Obra cambiada" : "Asignado a obra",
        description: obraActualNombre
          ? `Trabajador cambiado de "${obraActualNombre}" a "${obraNuevaNombre}".`
          : "Trabajador asignado a la obra exitosamente"
      })

      cargarDatos()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error?.message || "No se pudo asignar"
      })
    }
  }

  const desasignarDeObra = async (obraId: number) => {
    if (!trabajador) return

    if (!confirm('¿Desasignar trabajador de esta obra?')) return

    try {
      const { error } = await supabase
        .from('trabajadores_obras')
        .update({
          activo: false,
          fecha_retiro: new Date().toISOString()
        })
        .eq('obra_id', obraId)
        .eq('trabajador_id', trabajador.id)
        .eq('activo', true)

      if (error) throw error

      const obra = obrasDelTrabajador.find(o => o.id === obraId)
      await agregarHistorial('obra', `Desasignado de obra: ${obra?.nombre}`)

      addToast({
        type: "success",
        title: "Desasignado",
        description: "Trabajador desasignado de la obra"
      })

      cargarDatos()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo desasignar"
      })
    }
  }

  const cambiarEstado = async (nuevoEstado: Trabajador['estado']) => {
    if (!trabajador) return

    const trabajadorActualizado = {
      ...trabajador,
      estado: nuevoEstado
    }

    try {
      await trabajadoresService.update(trabajador.id, trabajadorActualizado)
      setTrabajador(trabajadorActualizado)
      await agregarHistorial('estado', `Estado cambiado a: ${getEstadoTexto(nuevoEstado)}`, getEstadoTexto(trabajador.estado), getEstadoTexto(nuevoEstado))

      addToast({
        type: "success",
        title: "Estado actualizado",
        description: `Estado cambiado a ${getEstadoTexto(nuevoEstado)}`
      })

      setDialogCambiarEstado(false)
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo cambiar el estado"
      })
    }
  }

  const abrirDialogoEditar = () => {
    if (!trabajador) return
    setFormEditarTrabajador({
      nombre: trabajador.nombre || '',
      rut: trabajador.rut || '',
      cargo: trabajador.cargo || '',
      telefono: trabajador.telefono || '',
      email: trabajador.email || '',
      direccion: trabajador.direccion || '',
      fecha_ingreso: trabajador.fecha_ingreso || '',
      contrato: trabajador.contrato || '',
      nivel: trabajador.nivel || '',
      fecha_termino: ''
    })
    setDialogEditarTrabajador(true)
  }

  const guardarEdicion = async () => {
    if (!trabajador) return

    try {
      const trabajadorActualizado: Trabajador = {
        ...trabajador,
        nombre: formEditarTrabajador.nombre,
        rut: formEditarTrabajador.rut,
        cargo: formEditarTrabajador.cargo,
        telefono: formEditarTrabajador.telefono,
        email: formEditarTrabajador.email,
        direccion: formEditarTrabajador.direccion,
        fecha_ingreso: formEditarTrabajador.fecha_ingreso,
        contrato: formEditarTrabajador.contrato,
        nivel: formEditarTrabajador.nivel as 'obrero' | 'tecnico' | 'profesional' | 'jefatura' | 'gerencia' | undefined
      }

      await trabajadoresService.update(trabajador.id, trabajadorActualizado)
      setTrabajador(trabajadorActualizado)
      await agregarHistorial('otro', `Datos actualizados: ${Object.keys(formEditarTrabajador).filter(k => k !== 'fecha_termino').join(', ')}`)

      addToast({
        type: "success",
        title: "Guardado",
        description: "Datos del trabajador actualizados"
      })

      setDialogEditarTrabajador(false)
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo actualizar"
      })
    }
  }

  const agregarHistorial = async (tipo: string, campo: string, valorAnterior?: string, valorNuevo?: string) => {
    if (!trabajador) return

    try {
      const { data } = await supabase
        .from('historial_cambios')
        .insert([{
          trabajador_id: trabajador.id,
          tipo,
          campo,
          valor_anterior: valorAnterior || '',
          valor_nuevo: valorNuevo || campo,
          motivo: null,
          realizado_por: null
        }])
        .select()
        .single()

      if (data) {
        setHistorial([data, ...historial])
      }
    } catch (error) {
      console.error('Error guardando historial:', error)
    }
  }

  const eliminarDocumento = async (docId: number) => {
    const doc = documentos.find(d => d.id === docId)

    if (!confirm(`¿Eliminar documento "${doc?.nombre}"?`)) return

    try {
      const { error } = await supabase
        .from('documentos_trabajador')
        .delete()
        .eq('id', docId)

      if (error) throw error

      setDocumentos(documentos.filter(d => d.id !== docId))
      if (doc) {
        await agregarHistorial('otro', `Documento eliminado: ${doc.nombre}`)
      }
      addToast({
        type: "success",
        title: "Eliminado",
        description: "Documento eliminado"
      })
      cargarDatos()
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: "No se pudo eliminar"
      })
    }
  }

  const descargarDocumento = (doc: DocumentoTrabajador) => {
    const link = document.createElement('a')
    link.href = doc.archivo
    link.download = doc.nombre
    link.click()
  }

  const toggleSeccionObra = (obraId: number) => {
    setSeccionesObrasAbiertas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(obraId)) {
        newSet.delete(obraId)
      } else {
        newSet.add(obraId)
      }
      return newSet
    })
  }

  const getEstadoColor = (estado: string) => ({
    'activo': 'bg-green-100 text-green-800',
    'vacaciones': 'bg-blue-100 text-blue-800',
    'licencia': 'bg-yellow-100 text-yellow-800',
    'retirado': 'bg-gray-100 text-gray-800'
  }[estado])

  const getEstadoTexto = (estado: string) => ({
    'activo': 'Activo',
    'vacaciones': 'Vacaciones',
    'licencia': 'Licencia',
    'retirado': 'Retirado'
  }[estado])

  const getNivelColor = (nivel?: string) => {
    if (!nivel) return 'bg-gray-100 text-gray-800'
    return ({
      'obrero': 'bg-gray-100 text-gray-800',
      'tecnico': 'bg-blue-100 text-blue-800',
      'profesional': 'bg-purple-100 text-purple-800',
      'jefatura': 'bg-orange-100 text-orange-800',
      'gerencia': 'bg-red-100 text-red-800'
    }[nivel] || 'bg-gray-100 text-gray-800')
  }

  const getNivelTexto = (nivel?: string) => {
    if (!nivel) return '-'
    return ({
      'obrero': 'Obrero',
      'tecnico': 'Técnico',
      'profesional': 'Profesional',
      'jefatura': 'Jefatura',
      'gerencia': 'Gerencia'
    }[nivel] || '-')
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getPromedioEvaluaciones = (evaluaciones: Evaluacion[]) => {
    if (!evaluaciones || evaluaciones.length === 0) return 0
    return evaluaciones.reduce((sum, e) => sum + e.puntaje, 0) / evaluaciones.length
  }

  const calcularDiasTrabajados = () => {
    if (!trabajador?.fecha_ingreso) return 0
    const inicio = new Date(trabajador.fecha_ingreso)
    const hoy = new Date()
    const diff = hoy.getTime() - inicio.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="w-80 border-r bg-gray-50">
          <Skeleton className="h-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-full" />
        </div>
      </div>
    )
  }

  if (!trabajador) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Trabajador no encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/trabajadores')}>
            Volver a Trabajadores
          </Button>
        </div>
      </div>
    )
  }

  const promedio = getPromedioEvaluaciones(evaluaciones)
  const diasTrabajados = calcularDiasTrabajados()
  const obrasActivas = obrasDelTrabajador.filter(o => o.activo)

  // Calcular documentos de PREVENCIÓN pendientes
  const documentosPrevencionObligatorios = ['odi', 'odi_cargo', 'cedula_identidad', 'entrega_epp', 'politica_acoso', 'certificado_antecedentes', 'entrega_ri', 'politica_ad', 'politica_sso', 'datos_personales']
  const docsPrevencion = documentos.filter(d => !d.obra_id)
  const docsPrevPendientes = documentosPrevencionObligatorios.filter(tipo => !docsPrevencion.some(d => d.tipo === tipo)).length

  // Calcular documentos ADMINISTRATIVOS pendientes por obra
  const docsAdminPendientes = obrasDelTrabajador.reduce((total, obra) => {
    const docsObra = documentos.filter(d => d.obra_id === obra.id)
    const tieneContrato = docsObra.some(d => d.tipo === 'contrato')
    const tieneAnexo = docsObra.some(d => d.tipo === 'anexo')
    const tieneFiniquito = docsObra.some(d => d.tipo === 'finiquito')

    let pendientes = 0

    // Lógica de documentos obligatorios por obra
    const obraAnterior = obrasDelTrabajador.find(o =>
      o.id !== obra.id &&
      new Date(o.fecha_asignacion) < new Date(obra.fecha_asignacion)
    )

    if (obraAnterior) {
      // Tiene obra anterior
      const docsObraAnterior = documentos.filter(d => d.obra_id === obraAnterior.id)
      const finiquitoAnterior = docsObraAnterior.some(d => d.tipo === 'finiquito')

      if (finiquitoAnterior) {
        // Se finiquitó en la obra anterior → necesita CONTRATO nuevo
        if (!tieneContrato) pendientes++
      } else {
        // NO se finiquitó en la obra anterior → necesita ANEXO
        if (!tieneAnexo) pendientes++
      }
    } else {
      // Es la primera obra → necesita CONTRATO
      if (!tieneContrato) pendientes++
    }

    // Si la obra ya terminó (fecha_retiro) → necesita FINIQUITO
    if (obra.fecha_retiro && !obra.activo && !tieneFiniquito) {
      pendientes++
    }

    return total + pendientes
  }, 0)

  const tieneDocsCompletos = docsPrevPendientes === 0 && docsAdminPendientes === 0

  return (
    <div className="flex h-full overflow-hidden">
      {/* SIDEBAR IZQUIERDO - MÁS COMPACTO */}
      <div className="w-80 border-r bg-gray-50 flex-shrink-0 overflow-hidden">
        <TrabajadoresList selectedId={trabajador.id} compact onNuevoTrabajador={() => {}} />
      </div>

      <div className="flex-1 flex flex-col bg-white overflow-hidden" style={{ opacity: isPending ? 0.7 : 1 }}>
        {/* HEADER COMPACTO */}
        <div className="border-b px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {trabajador.foto ? (
                <img src={trabajador.foto} alt={trabajador.nombre} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full text-white font-bold" style={{ backgroundColor: '#0066cc' }}>
                  {trabajador.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-gray-900">{trabajador.nombre}</h2>
                <p className="text-sm text-gray-600">{trabajador.cargo}</p>
              </div>

              <div className="flex gap-2">
                <Badge className={getEstadoColor(trabajador.estado)}>{getEstadoTexto(trabajador.estado)}</Badge>
                {promedio > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    {promedio.toFixed(1)}
                  </Badge>
                )}
                {docsPrevPendientes > 0 && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <Shield className="h-3 w-3 mr-1" />
                    {docsPrevPendientes} prev.
                  </Badge>
                )}
                {docsAdminPendientes > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    <FileText className="h-3 w-3 mr-1" />
                    {docsAdminPendientes} admin.
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={abrirDialogoEditar}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button size="sm" onClick={() => setDialogAsignarObra(true)} style={{ backgroundColor: '#0066cc', color: 'white' }}>
                <Building2 className="h-4 w-4 mr-1" />
                Asignar Obra
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDialogCambiarEstado(true)}>
                <UserCog className="h-4 w-4 mr-1" />
                Estado
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push(`/contratos/nuevo?trabajador=${trabajador.id}`)}>
                <FileText className="h-4 w-4 mr-1" />
                Contrato
              </Button>
              <Button size="sm" variant="ghost" onClick={() => router.push('/trabajadores')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={tabActivo} onValueChange={setTabActivo} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start px-6 border-b rounded-none h-11">
            <TabsTrigger value="info" className="text-sm">Información</TabsTrigger>
            <TabsTrigger value="obras" className="text-sm">
              Obras
              <Badge variant="outline" className="ml-2 text-xs">{obrasDelTrabajador.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="documentacion" className="text-sm">
              Documentación
              <Badge variant="outline" className="ml-2 text-xs">{documentos.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="contratos" className="text-sm">Contratos</TabsTrigger>
            <TabsTrigger value="evaluaciones" className="text-sm">
              Evaluaciones
              <Badge variant="outline" className="ml-2 text-xs">{evaluaciones.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="historial" className="text-sm">Historial</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* TAB INFORMACIÓN */}
            <TabsContent value="info" className="m-0 p-6 space-y-6">
              {/* MÉTRICAS COMPACTAS EN LÍNEA */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="grid grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{diasTrabajados}</p>
                      <p className="text-xs text-gray-600">Días trabajados</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{obrasActivas.length}</p>
                      <p className="text-xs text-gray-600">Obras activas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${tieneDocsCompletos ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tieneDocsCompletos ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${tieneDocsCompletos ? 'text-green-600' : 'text-red-600'}`}>
                        {tieneDocsCompletos ? '✓' : (docsPrevPendientes + docsAdminPendientes)}
                      </p>
                      <p className="text-xs text-gray-600">Docs pendientes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{promedio > 0 ? promedio.toFixed(1) : '-'}</p>
                      <p className="text-xs text-gray-600">Evaluación</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DATOS EN DOS COLUMNAS */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Datos Personales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">RUT</span>
                      <span className="font-semibold text-gray-900">{trabajador.rut}</span>
                    </div>
                    {trabajador.telefono && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Teléfono</span>
                        <span className="font-semibold text-gray-900">{trabajador.telefono}</span>
                      </div>
                    )}
                    {trabajador.email && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Email</span>
                        <span className="font-semibold text-gray-900 truncate max-w-[240px]" title={trabajador.email}>
                          {trabajador.email}
                        </span>
                      </div>
                    )}
                    {trabajador.direccion && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Dirección</span>
                        <span className="font-semibold text-gray-900 truncate max-w-[240px]" title={trabajador.direccion}>
                          {trabajador.direccion}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-green-600" />
                      Información Laboral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Cargo</span>
                      <span className="font-semibold text-gray-900">{trabajador.cargo || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Ingreso</span>
                      <span className="font-semibold text-gray-900">
                        {trabajador.fecha_ingreso ? new Date(trabajador.fecha_ingreso).toLocaleDateString('es-CL') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Contrato</span>
                      <span className="font-semibold text-gray-900 capitalize">{trabajador.contrato || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Nivel</span>
                      <Badge className={getNivelColor(trabajador.nivel)} variant="secondary">
                        {getNivelTexto(trabajador.nivel)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB OBRAS */}
            <TabsContent value="obras" className="m-0 p-6 space-y-3">
              {obrasDelTrabajador.length > 0 ? (
                obrasDelTrabajador.map((obra) => (
                  <Card key={obra.id} className={obra.activo ? 'border-green-300 bg-green-50/30' : ''}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 flex-1">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${obra.activo ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Building2 className={`h-5 w-5 ${obra.activo ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{obra.nombre}</h4>
                              {obra.activo && <Badge className="bg-green-600 text-white text-xs">Activa</Badge>}
                            </div>
                            <p className="text-sm text-gray-600">{obra.cliente}</p>
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              <span>{obra.cargo_en_obra}</span>
                              <span>•</span>
                              <span>Desde {new Date(obra.fecha_asignacion).toLocaleDateString('es-CL')}</span>
                              {obra.fecha_retiro && <span>hasta {new Date(obra.fecha_retiro).toLocaleDateString('es-CL')}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/obras/${obra.id}`)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          {obra.activo && (
                            <Button size="sm" variant="ghost" onClick={() => desasignarDeObra(obra.id)} className="text-red-600">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">Sin obras asignadas</p>
                  <Button onClick={() => setDialogAsignarObra(true)}>Asignar a Obra</Button>
                </div>
              )}
            </TabsContent>

            {/* TAB DOCUMENTACIÓN */}
            <TabsContent value="documentacion" className="m-0 p-6 space-y-4">
              {/* SECCIÓN DE PREVENCIÓN */}
              <Card className="border-2">
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition pb-3"
                  onClick={() => setSeccionPrevencionAbierta(!seccionPrevencionAbierta)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Documentos de Prevención</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Aplican para todas las obras</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {docsPrevPendientes > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          {docsPrevPendientes} pendientes
                        </Badge>
                      )}
                      <Badge variant="outline">{docsPrevencion.length}/{documentosPrevencionObligatorios.length}</Badge>
                      <ChevronDown className={`h-5 w-5 transition-transform ${seccionPrevencionAbierta ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
                {seccionPrevencionAbierta && (
                  <CardContent className="pt-0">
                    {docsPrevencion.length > 0 ? (
                      <div className="space-y-2">
                        {docsPrevencion.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-2 rounded border hover:bg-gray-50">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{doc.nombre}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(doc.fecha_subida).toLocaleDateString('es-CL')} • {formatBytes(doc.tamanio)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => descargarDocumento(doc)}>
                                <Download className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => eliminarDocumento(doc.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Sin documentos de prevención</p>
                    )}
                    {docsPrevPendientes > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-orange-600 mb-2">Documentos Pendientes:</p>
                        <div className="flex flex-wrap gap-2">
                          {documentosPrevencionObligatorios
                            .filter(tipo => !docsPrevencion.some(d => d.tipo === tipo))
                            .map(tipo => (
                              <Badge key={tipo} variant="outline" className="text-xs">
                                {tipo.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* SECCIONES POR OBRA */}
              {obrasDelTrabajador.map((obra) => {
                const docsObra = documentos.filter(d => d.obra_id === obra.id)
                const tieneContrato = docsObra.some(d => d.tipo === 'contrato')
                const tieneAnexo = docsObra.some(d => d.tipo === 'anexo')
                const tieneFiniquito = docsObra.some(d => d.tipo === 'finiquito')

                // Calcular qué documentos administrativos faltan
                const docsFaltantes: string[] = []
                const obraAnterior = obrasDelTrabajador.find(o =>
                  o.id !== obra.id &&
                  new Date(o.fecha_asignacion) < new Date(obra.fecha_asignacion)
                )

                if (obraAnterior) {
                  const docsObraAnterior = documentos.filter(d => d.obra_id === obraAnterior.id)
                  const finiquitoAnterior = docsObraAnterior.some(d => d.tipo === 'finiquito')

                  if (finiquitoAnterior && !tieneContrato) {
                    docsFaltantes.push('Contrato (finiquitado en obra anterior)')
                  } else if (!finiquitoAnterior && !tieneAnexo) {
                    docsFaltantes.push('Anexo de Cambio de Obra')
                  }
                } else if (!tieneContrato) {
                  docsFaltantes.push('Contrato (primera obra)')
                }

                if (obra.fecha_retiro && !obra.activo && !tieneFiniquito) {
                  docsFaltantes.push('Finiquito')
                }

                const estaAbierta = seccionesObrasAbiertas.has(obra.id)

                return (
                  <Card key={obra.id} className={`border-2 ${docsFaltantes.length > 0 ? 'border-red-200' : ''}`}>
                    <CardHeader
                      className="cursor-pointer hover:bg-gray-50 transition pb-3"
                      onClick={() => toggleSeccionObra(obra.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${obra.activo ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Building2 className={`h-5 w-5 ${obra.activo ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{obra.nombre}</CardTitle>
                              {obra.activo && <Badge className="bg-green-600 text-white text-xs">Activa</Badge>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Desde {new Date(obra.fecha_asignacion).toLocaleDateString('es-CL')}
                              {obra.fecha_retiro && ` hasta ${new Date(obra.fecha_retiro).toLocaleDateString('es-CL')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {docsFaltantes.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {docsFaltantes.length} pendientes
                            </Badge>
                          )}
                          <Badge variant="outline">{docsObra.length} docs</Badge>
                          <ChevronDown className={`h-5 w-5 transition-transform ${estaAbierta ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                    {estaAbierta && (
                      <CardContent className="pt-0">
                        {docsObra.length > 0 ? (
                          <div className="space-y-2">
                            {docsObra.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-2 rounded border hover:bg-gray-50">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{doc.nombre}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(doc.fecha_subida).toLocaleDateString('es-CL')} • {formatBytes(doc.tamanio)} • {doc.tipo.toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => descargarDocumento(doc)}>
                                    <Download className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => eliminarDocumento(doc.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">Sin documentos administrativos</p>
                        )}
                        {docsFaltantes.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-semibold text-red-600 mb-2">Documentos Administrativos Pendientes:</p>
                            <div className="flex flex-wrap gap-2">
                              {docsFaltantes.map((doc, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs text-red-600">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}

              {obrasDelTrabajador.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Building2 className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">Sin obras asignadas</p>
                  <Button onClick={() => setDialogAsignarObra(true)} style={{ backgroundColor: '#0066cc', color: 'white' }}>
                    Asignar a Obra
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB CONTRATOS */}
            <TabsContent value="contratos" className="m-0">
              <TabContratos
                trabajadorId={trabajador.id}
                trabajador={trabajador}
                obras={todasLasObras}
              />
            </TabsContent>

            {/* TAB EVALUACIONES */}
            <TabsContent value="evaluaciones" className="m-0 p-6">
              {evaluaciones.length > 0 ? (
                <div className="space-y-3">
                  {evaluaciones.map((ev) => (
                    <Card key={ev.id}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge variant="outline" className="mb-2">{ev.tipo}</Badge>
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`h-4 w-4 ${i <= ev.puntaje ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                              ))}
                              <span className="ml-2 font-bold">{ev.puntaje}/5</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(ev.fecha).toLocaleDateString('es-CL')}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{ev.comentarios}</p>
                        <p className="text-xs text-gray-500">Evaluador: {ev.evaluador}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">Sin evaluaciones registradas</p>
                </div>
              )}
            </TabsContent>

            {/* TAB HISTORIAL */}
            <TabsContent value="historial" className="m-0 p-6 space-y-2">
              {historial.length > 0 ? (
                historial.map((cambio) => (
                  <div key={cambio.id} className="flex gap-3 p-3 rounded border hover:bg-gray-50">
                    <History className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{cambio.campo}</p>
                      {cambio.valor_anterior && cambio.valor_nuevo && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {cambio.valor_anterior} → {cambio.valor_nuevo}
                        </p>
                      )}
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{cambio.tipo}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(cambio.fecha).toLocaleDateString('es-CL')} {new Date(cambio.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <History className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">Sin historial de cambios</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* DIALOGS */}
        <Dialog open={dialogAsignarObra} onOpenChange={setDialogAsignarObra}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Asignar a Obra</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Obra *</Label>
                <Select value={formAsignarObra.obra_id} onValueChange={(v) => setFormAsignarObra({...formAsignarObra, obra_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {todasLasObras
                      .filter(obra => !obrasDelTrabajador.some(ot => ot.id === obra.id && ot.activo))
                      .map(obra => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cargo en la Obra *</Label>
                <Input
                  placeholder="Ej: Maestro de Obra"
                  value={formAsignarObra.cargo_en_obra}
                  onChange={(e) => setFormAsignarObra({...formAsignarObra, cargo_en_obra: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAsignarObra(false)}>
                Cancelar
              </Button>
              <Button
                onClick={iniciarAsignacionObra}
                style={{ backgroundColor: '#0066cc', color: 'white' }}
              >
                Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogCambiarEstado} onOpenChange={setDialogCambiarEstado}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Cambiar Estado</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              {(['activo', 'vacaciones', 'licencia', 'retirado'] as const).map(estado => (
                <Button
                  key={estado}
                  size="lg"
                  variant={trabajador.estado === estado ? 'default' : 'outline'}
                  onClick={() => cambiarEstado(estado)}
                  className="h-20 flex-col gap-1"
                  style={trabajador.estado === estado ? {
                    backgroundColor: estado === 'activo' ? '#10b981' : estado === 'vacaciones' ? '#3b82f6' : estado === 'licencia' ? '#f59e0b' : '#6b7280',
                    color: 'white'
                  } : {}}
                >
                  <span>{getEstadoTexto(estado)}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogEditarTrabajador} onOpenChange={setDialogEditarTrabajador}>
          <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Trabajador</DialogTitle>
              <DialogDescription>
                Actualiza los datos del trabajador
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre Completo *</Label>
                  <Input
                    value={formEditarTrabajador.nombre}
                    onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, nombre: e.target.value})}
                  />
                </div>

                <div>
                  <Label>RUT *</Label>
                  <Input
                    value={formEditarTrabajador.rut}
                    onChange={(e) => {
                      const rutFormateado = formatearRut(e.target.value)
                      setFormEditarTrabajador({...formEditarTrabajador, rut: rutFormateado})
                    }}
                    placeholder="12.345.678-9"
                  />
                  {formEditarTrabajador.rut && !validarRut(formEditarTrabajador.rut) && (
                    <p className="text-xs text-red-600 mt-1">RUT inválido</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Cargo *</Label>
                <Input
                  value={formEditarTrabajador.cargo}
                  onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, cargo: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formEditarTrabajador.telefono}
                    onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, telefono: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formEditarTrabajador.email}
                    onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Dirección</Label>
                <Input
                  value={formEditarTrabajador.direccion}
                  onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, direccion: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Ingreso</Label>
                  <Input
                    type="date"
                    value={formEditarTrabajador.fecha_ingreso}
                    onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, fecha_ingreso: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Tipo de Contrato</Label>
                  <Select
                    value={formEditarTrabajador.contrato}
                    onValueChange={(v) => setFormEditarTrabajador({...formEditarTrabajador, contrato: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                      <SelectItem value="plazo_fijo">Plazo Fijo</SelectItem>
                      <SelectItem value="obra_o_faena">Obra o Faena</SelectItem>
                      <SelectItem value="honorarios">Honorarios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formEditarTrabajador.contrato === 'plazo_fijo' && (
                <div>
                  <Label>Fecha de Término del Contrato</Label>
                  <Input
                    type="date"
                    value={formEditarTrabajador.fecha_termino || ''}
                    onChange={(e) => setFormEditarTrabajador({...formEditarTrabajador, fecha_termino: e.target.value})}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogEditarTrabajador(false)}>
                Cancelar
              </Button>
              <Button
                onClick={guardarEdicion}
                style={{ backgroundColor: '#0066cc', color: 'white' }}
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirmCambioObra}
          onOpenChange={setConfirmCambioObra}
          title="Cambio de Obra"
          description={`¿Cambiar de "${obraAnteriorNombre}" a "${obraNuevaNombre}"?`}
          confirmText="Aceptar"
          cancelText="Cancelar"
          variant="warning"
          onConfirm={() => {
            const obraId = parseInt(formAsignarObra.obra_id)
            ejecutarAsignacion(obraId, obraNuevaNombre, obraAnteriorNombre)
          }}
        />
      </div>
    </div>
  )
}

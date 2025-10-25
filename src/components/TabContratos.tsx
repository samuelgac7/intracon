"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Download, Upload, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { contratosService, calcularSuple } from '@/services/contratos'
import { generarYGuardarContrato, generarYGuardarAnexoExtension } from '@/lib/pdf-contratos'
import type { Contrato } from '@/services/contratos'
import type { Trabajador, Obra } from '@/lib/supabase'

interface TabContratosProps {
  trabajadorId: number
  trabajador: Trabajador
  obras: Obra[]
}

export default function TabContratos({ trabajadorId, trabajador, obras }: TabContratosProps) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogNuevoContrato, setDialogNuevoContrato] = useState(false)
  const [dialogAnexo, setDialogAnexo] = useState(false)
  const [contratoSeleccionado, setContratoSeleccionado] = useState<Contrato | null>(null)
  const [generando, setGenerando] = useState(false)
  
  const [formContrato, setFormContrato] = useState({
    obra_id: '',
    tipo_contrato: 'plazo-fijo' as 'plazo-fijo' | 'indefinido',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_termino: '',
    duracion_valor: '',
    duracion_unidad: 'dias' as 'dias' | 'semanas' | 'meses',
    cargo: trabajador?.cargo || '',
    salario_base: trabajador?.salario ? parseInt(trabajador.salario.replace(/[^0-9]/g, '')) : 0,
    jornada_tipo: 'estandar' as 'estandar' | 'especial',
    jornada_detalle: ''
  })
  
  const [formAnexo, setFormAnexo] = useState({
    nueva_fecha_termino: ''
  })

  useEffect(() => {
    cargarContratos()
  }, [trabajadorId])

  const cargarContratos = async () => {
    try {
      setLoading(true)
      const data = await contratosService.getByTrabajador(trabajadorId)
      setContratos(data)
    } catch (error) {
      console.error('Error cargando contratos:', error)
      alert('Error al cargar contratos')
    } finally {
      setLoading(false)
    }
  }

  const generarContrato = async () => {
    if (!formContrato.obra_id || !formContrato.cargo || !formContrato.salario_base) {
      alert('Completa: Obra, Cargo y Salario Base')
      return
    }

    if (formContrato.tipo_contrato === 'plazo-fijo' && !formContrato.fecha_termino) {
      alert('Para contrato plazo fijo debes especificar fecha de término')
      return
    }

    setGenerando(true)
    try {
      const obra = obras.find(o => o.id === parseInt(formContrato.obra_id))
      const ciudadContrato = obra?.ubicacion?.split(',')[0]?.trim() || 'Santiago'

      const contrato = await contratosService.crear({
        trabajador_id: trabajadorId,
        obra_id: parseInt(formContrato.obra_id),
        tipo_contrato: formContrato.tipo_contrato,
        fecha_inicio: formContrato.fecha_inicio,
        fecha_termino: formContrato.tipo_contrato === 'plazo-fijo' ? formContrato.fecha_termino : undefined,
        duracion_valor: formContrato.duracion_valor ? parseInt(formContrato.duracion_valor) : undefined,
        duracion_unidad: formContrato.duracion_unidad,
        ciudad_contrato: ciudadContrato,
        cargo: formContrato.cargo,
        salario_base: formContrato.salario_base,
        jornada_tipo: formContrato.jornada_tipo,
        jornada_detalle: formContrato.jornada_detalle || undefined,
        afp: trabajador.afp,
        prevision: trabajador.prevision,
        isapre: trabajador.isapre
      })

      await generarYGuardarContrato(contrato)

      alert('✅ Contrato generado exitosamente!\n\nEl PDF ha sido generado y guardado.')
      setDialogNuevoContrato(false)
      
      setFormContrato({
        obra_id: '',
        tipo_contrato: 'plazo-fijo',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_termino: '',
        duracion_valor: '',
        duracion_unidad: 'dias',
        cargo: trabajador?.cargo || '',
        salario_base: trabajador?.salario ? parseInt(trabajador.salario.replace(/[^0-9]/g, '')) : 0,
        jornada_tipo: 'estandar',
        jornada_detalle: ''
      })
      
      await cargarContratos()
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Error generando contrato: ' + (error.message || 'Error desconocido'))
    } finally {
      setGenerando(false)
    }
  }

  const generarAnexoExtension = async () => {
    if (!contratoSeleccionado || !formAnexo.nueva_fecha_termino) {
      alert('Selecciona una nueva fecha de término')
      return
    }

    setGenerando(true)
    try {
      const anexo = await contratosService.crearAnexoExtension({
        contrato_padre_id: contratoSeleccionado.id,
        nueva_fecha_termino: formAnexo.nueva_fecha_termino
      })

      await generarYGuardarAnexoExtension(anexo)

      alert('✅ Anexo de extensión generado!\n\nNueva fecha de término actualizada.')
      setDialogAnexo(false)
      setContratoSeleccionado(null)
      setFormAnexo({ nueva_fecha_termino: '' })
      
      await cargarContratos()
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Error generando anexo: ' + (error.message || 'Error desconocido'))
    } finally {
      setGenerando(false)
    }
  }

  const descargarPDF = (pdfUrl: string, nombreArchivo: string) => {
    if (!pdfUrl) {
      alert('PDF no disponible')
      return
    }
    
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = nombreArchivo + '.pdf'
    link.target = '_blank'
    link.click()
  }

  const subirPDFFirmado = async (contratoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede superar 10MB')
      return
    }

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        await contratosService.marcarFirmado(contratoId, base64)
        
        alert('✅ Contrato firmado subido correctamente')
        await cargarContratos()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al subir contrato firmado')
    }
    
    e.target.value = ''
  }

  const getEstadoVigencia = (contrato: Contrato) => {
    if (!contrato.fecha_termino) return 'INDEFINIDO'
    
    const hoy = new Date()
    const fechaTermino = new Date(contrato.fecha_termino)
    const diffDias = Math.ceil((fechaTermino.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDias < 0) return 'VENCIDO'
    if (diffDias <= 7) return 'POR_VENCER'
    return 'VIGENTE'
  }

  const getBadgeVigencia = (estado: string) => {
    const styles = {
      'INDEFINIDO': 'bg-blue-100 text-blue-800',
      'VIGENTE': 'bg-green-100 text-green-800',
      'POR_VENCER': 'bg-yellow-100 text-yellow-800',
      'VENCIDO': 'bg-red-100 text-red-800'
    }
    
    const icons = {
      'INDEFINIDO': <CheckCircle2 className="h-3 w-3 mr-1" />,
      'VIGENTE': <CheckCircle2 className="h-3 w-3 mr-1" />,
      'POR_VENCER': <AlertCircle className="h-3 w-3 mr-1" />,
      'VENCIDO': <AlertCircle className="h-3 w-3 mr-1" />
    }
    
    return (
      <Badge className={styles[estado as keyof typeof styles]}>
        {icons[estado as keyof typeof icons]}
        {estado.replace('_', ' ')}
      </Badge>
    )
  }

  const contratosAgrupados = contratos.reduce((acc, contrato) => {
    if (contrato.es_anexo) {
      const padre = acc.find(c => c.id === contrato.contrato_padre_id)
      if (padre) {
        if (!padre.anexos) padre.anexos = []
        padre.anexos.push(contrato)
      }
    } else {
      acc.push({ ...contrato, anexos: [] })
    }
    return acc
  }, [] as (Contrato & { anexos?: Contrato[] })[])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Clock className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contratos</h3>
          <p className="text-sm text-gray-500">Gestión de contratos y anexos</p>
        </div>
        <Button onClick={() => setDialogNuevoContrato(true)} style={{ backgroundColor: '#0066cc', color: 'white' }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contrato
        </Button>
      </div>

      {contratosAgrupados.length > 0 ? (
        <div className="space-y-4">
          {contratosAgrupados.map(contrato => {
            const estadoVigencia = getEstadoVigencia(contrato)
            const suple = calcularSuple(contrato.salario_base)
            const obra = obras.find(o => o.id === contrato.obra_id)
            
            return (
              <Card key={contrato.id} className="border-l-4" style={{ borderLeftColor: estadoVigencia === 'VENCIDO' ? '#ef4444' : estadoVigencia === 'POR_VENCER' ? '#f59e0b' : '#0066cc' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" style={{ color: '#0066cc' }} />
                        {contrato.numero_contrato}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getBadgeVigencia(estadoVigencia)}
                        <Badge variant="outline">
                          {contrato.tipo_contrato === 'indefinido' ? 'Indefinido' : 'Plazo Fijo'}
                        </Badge>
                        <Badge className={contrato.estado_firma === 'firmado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {contrato.estado_firma === 'firmado' ? '✓ Firmado' : '⏳ Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Obra</p>
                      <p className="font-medium">{obra?.nombre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cargo</p>
                      <p className="font-medium">{contrato.cargo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha Inicio</p>
                      <p className="font-medium">{new Date(contrato.fecha_inicio).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha Término</p>
                      <p className="font-medium">
                        {contrato.fecha_termino ? new Date(contrato.fecha_termino).toLocaleDateString('es-CL') : 'Indefinido'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="text-gray-500">Sueldo Base</p>
                      <p className="font-bold text-lg">${contrato.salario_base.toLocaleString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Suple Quincenal</p>
                      <p className="font-bold text-lg">${suple.toLocaleString('es-CL')}</p>
                    </div>
                  </div>

                  {contrato.anexos && contrato.anexos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Anexos ({contrato.anexos.length})</p>
                      <div className="space-y-2">
                        {contrato.anexos.map(anexo => (
                          <div key={anexo.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                            <div>
                              <p className="text-sm font-medium">{anexo.numero_contrato}</p>
                              <p className="text-xs text-gray-600">
                                Extensión hasta {new Date(anexo.fecha_termino!).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                            {anexo.pdf_url && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => descargarPDF(anexo.pdf_url!, anexo.numero_contrato)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {contrato.pdf_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => descargarPDF(contrato.pdf_url!, contrato.numero_contrato)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    )}
                    
                    {contrato.estado_firma === 'pendiente' && (
                      <>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          id={`upload-${contrato.id}`}
                          onChange={(e) => subirPDFFirmado(contrato.id, e)}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => document.getElementById(`upload-${contrato.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Firmado
                        </Button>
                      </>
                    )}
                    
                    {contrato.activo && estadoVigencia === 'POR_VENCER' && (
                      <Button 
                        size="sm" 
                        style={{ backgroundColor: '#f59e0b', color: 'white' }}
                        onClick={() => {
                          setContratoSeleccionado(contrato)
                          setDialogAnexo(true)
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Extender Plazo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">Sin contratos registrados</p>
            <Button onClick={() => setDialogNuevoContrato(true)} style={{ backgroundColor: '#0066cc', color: 'white' }}>
              <Plus className="h-4 w-4 mr-2" />
              Generar Primer Contrato
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogNuevoContrato} onOpenChange={setDialogNuevoContrato}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Generar Nuevo Contrato</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Obra *</Label>
                <Select value={formContrato.obra_id} onValueChange={(v) => setFormContrato({...formContrato, obra_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar obra..." /></SelectTrigger>
                  <SelectContent>
                    {obras.map(obra => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>{obra.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Contrato *</Label>
                <Select value={formContrato.tipo_contrato} onValueChange={(v: any) => setFormContrato({...formContrato, tipo_contrato: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plazo-fijo">Plazo Fijo</SelectItem>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cargo *</Label>
                <Input 
                  value={formContrato.cargo}
                  onChange={(e) => setFormContrato({...formContrato, cargo: e.target.value})}
                  placeholder="CARPINTERO"
                />
              </div>

              <div>
                <Label>Salario Base *</Label>
                <Input 
                  type="number"
                  value={formContrato.salario_base}
                  onChange={(e) => setFormContrato({...formContrato, salario_base: parseInt(e.target.value) || 0})}
                  placeholder="950000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suple calculado: ${calcularSuple(formContrato.salario_base).toLocaleString('es-CL')}
                </p>
              </div>

              <div>
                <Label>Fecha de Inicio *</Label>
                <Input 
                  type="date"
                  value={formContrato.fecha_inicio}
                  onChange={(e) => setFormContrato({...formContrato, fecha_inicio: e.target.value})}
                />
              </div>

              {formContrato.tipo_contrato === 'plazo-fijo' && (
                <>
                  <div>
                    <Label>Duración *</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        value={formContrato.duracion_valor}
                        onChange={(e) => setFormContrato({...formContrato, duracion_valor: e.target.value})}
                        placeholder="17"
                        className="flex-1"
                      />
                      <Select value={formContrato.duracion_unidad} onValueChange={(v: any) => setFormContrato({...formContrato, duracion_unidad: v})}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dias">Días</SelectItem>
                          <SelectItem value="semanas">Semanas</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Fecha de Término *</Label>
                    <Input 
                      type="date"
                      value={formContrato.fecha_termino}
                      onChange={(e) => setFormContrato({...formContrato, fecha_termino: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">📋 Vista Previa</p>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Trabajador:</strong> {trabajador?.nombre}</p>
                <p><strong>RUT:</strong> {trabajador?.rut}</p>
                <p><strong>Cargo:</strong> {formContrato.cargo}</p>
                <p><strong>Salario:</strong> ${formContrato.salario_base.toLocaleString('es-CL')}</p>
                <p><strong>Suple:</strong> ${calcularSuple(formContrato.salario_base).toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNuevoContrato(false)}>
              Cancelar
            </Button>
            <Button onClick={generarContrato} disabled={generando} style={{ backgroundColor: '#0066cc', color: 'white' }}>
              {generando ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              {generando ? 'Generando...' : 'Generar Contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAnexo} onOpenChange={setDialogAnexo}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Anexo de Extensión de Plazo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p><strong>Contrato:</strong> {contratoSeleccionado?.numero_contrato}</p>
              <p><strong>Fecha término actual:</strong> {contratoSeleccionado?.fecha_termino ? new Date(contratoSeleccionado.fecha_termino).toLocaleDateString('es-CL') : '-'}</p>
            </div>

            <div>
              <Label>Nueva Fecha de Término *</Label>
              <Input 
                type="date"
                value={formAnexo.nueva_fecha_termino}
                onChange={(e) => setFormAnexo({...formAnexo, nueva_fecha_termino: e.target.value})}
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Importante:</strong> Se generará un anexo que modifica solo la cláusula SÉPTIMA (fecha de término). Las demás condiciones se mantienen sin cambios.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAnexo(false)}>
              Cancelar
            </Button>
            <Button onClick={generarAnexoExtension} disabled={generando} style={{ backgroundColor: '#0066cc', color: 'white' }}>
              {generando ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              {generando ? 'Generando...' : 'Generar Anexo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
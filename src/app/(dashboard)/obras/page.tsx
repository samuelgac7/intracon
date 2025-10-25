"use client"

import ObrasList from "@/components/ObrasList"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileSpreadsheet, FileDown } from "lucide-react"
import { obrasService } from "@/services/obras"
import type { Obra } from "@/lib/supabase"

export default function ObrasPage() {
  const router = useRouter()
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogNueva, setDialogNueva] = useState(false)

  const [formNueva, setFormNueva] = useState({
    nombre: "",
    direccion: "",
    comuna: "",
    region: "Metropolitana",
    cliente: "",
    tipo: "construccion" as const,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaTermino: "",
    montoContrato: "",
    descripcion: ""
  })

  useEffect(() => {
    cargarObras()
  }, [])

  const cargarObras = async () => {
    try {
      const data = await obrasService.getAll()
      setObras(data)
    } catch (error) {
      console.error('Error cargando obras:', error)
      alert('Error al cargar obras')
    } finally {
      setLoading(false)
    }
  }

  const crearObra = async () => {
    if (!formNueva.nombre || !formNueva.direccion || !formNueva.comuna || !formNueva.cliente || !formNueva.fechaInicio || !formNueva.montoContrato) {
      alert("Completa: Nombre, Dirección, Comuna, Cliente, Fecha Inicio y Monto")
      return
    }

    try {
      const monto = parseFloat(formNueva.montoContrato.replace(/[$.]/g, ''))
      if (isNaN(monto)) {
        alert("El monto debe ser un número válido")
        return
      }

      const nuevaObra: Omit<Obra, 'id' | 'fecha_creacion' | 'ultima_actualizacion'> = {
        nombre: formNueva.nombre,
        direccion: formNueva.direccion,
        comuna: formNueva.comuna,
        region: formNueva.region,
        cliente: formNueva.cliente,
        tipo: formNueva.tipo,
        fecha_inicio: formNueva.fechaInicio,
        fecha_termino_estimada: formNueva.fechaTermino || undefined,
        monto_contrato: monto,
        estado: 'planificacion',
        progreso: 0,
        descripcion: formNueva.descripcion || undefined
      }

      const obraCreada = await obrasService.create(nuevaObra)

      // Actualizar lista local
      setObras([...obras, obraCreada])

      // Cerrar dialog
      setDialogNueva(false)

      alert(`Obra registrada: ${obraCreada.nombre}`)

      // Reset form
      setFormNueva({
        nombre: "",
        direccion: "",
        comuna: "",
        region: "Metropolitana",
        cliente: "",
        tipo: "construccion",
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaTermino: "",
        montoContrato: "",
        descripcion: ""
      })

      // Navegar al detalle
      router.push(`/obras/${obraCreada.id}`)

    } catch (error: any) {
      console.error('Error creando obra:', error)
      alert(`Error al crear obra: ${error.message || 'Error desconocido'}`)
    }
  }

  const exportarExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const datos = obras.map(o => ({
        'Nombre': o.nombre,
        'Dirección': o.direccion,
        'Comuna': o.comuna,
        'Cliente': o.cliente,
        'Estado': o.estado,
        'Progreso': `${o.progreso}%`,
        'Monto': `$${(o.monto_contrato || 0).toLocaleString('es-CL')}`,
        'Inicio': new Date(o.fecha_inicio).toLocaleDateString('es-CL')
      }))
      const ws = XLSX.utils.json_to_sheet(datos)
      ws['!cols'] = Array(8).fill({ wch: 18 })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Obras")
      XLSX.writeFile(wb, `Obras_${new Date().toISOString().split('T')[0]}.xlsx`)
      alert(`Excel generado: ${datos.length} obras`)
    } catch (error) {
      alert('Error al generar Excel')
    }
  }

  const exportarPDF = async () => {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
      await import('jspdf-autotable')

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }) as any

      doc.setFontSize(20)
      doc.setTextColor(0, 102, 204)
      doc.text('TECNYCON CONSTRUCTORA', 15, 15)
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Reporte de Obras', 15, 25)
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 15, 32)
      doc.text(`Total: ${obras.length}`, 15, 37)

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 43,
          head: [['Obra', 'Cliente', 'Estado', 'Progreso', 'Monto']],
          body: obras.map(o => [
            o.nombre,
            o.cliente,
            o.estado,
            `${o.progreso}%`,
            `$${(o.monto_contrato || 0).toLocaleString('es-CL')}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [0, 102, 204] },
          styles: { fontSize: 8 }
        })
      }

      doc.save(`Obras_${new Date().toISOString().split('T')[0]}.pdf`)
      alert(`PDF generado: ${obras.length} obras`)
    } catch (error) {
      alert('Error al generar PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando obras...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Vista Solo Lista Fullscreen */}
      <div className="h-full relative">
        <ObrasList onNuevaObra={() => setDialogNueva(true)} />

        {/* Botones Export en esquina */}
        {obras.length > 0 && (
          <div className="fixed top-20 right-6 flex gap-2 z-10">
            <Button variant="outline" size="sm" onClick={exportarExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportarPDF}>
              <FileDown className="h-4 w-4 mr-2" />PDF
            </Button>
          </div>
        )}
      </div>

      {/* Botón Flotante para Nueva Obra */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg text-white"
        style={{ backgroundColor: '#0066cc' }}
        onClick={() => setDialogNueva(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialog Nueva Obra */}
      <Dialog open={dialogNueva} onOpenChange={setDialogNueva}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Obra</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Nombre de la Obra *</Label>
              <Input
                placeholder="Ej: Edificio Portal Central"
                value={formNueva.nombre}
                onChange={(e) => setFormNueva({...formNueva, nombre: e.target.value})}
              />
            </div>

            <div>
              <Label>Dirección *</Label>
              <Input
                placeholder="Ej: Av. Apoquindo 3500"
                value={formNueva.direccion}
                onChange={(e) => setFormNueva({...formNueva, direccion: e.target.value})}
              />
            </div>

            <div>
              <Label>Comuna *</Label>
              <Input
                placeholder="Ej: Las Condes"
                value={formNueva.comuna}
                onChange={(e) => setFormNueva({...formNueva, comuna: e.target.value})}
              />
            </div>

            <div>
              <Label>Región</Label>
              <Input
                placeholder="Ej: Metropolitana"
                value={formNueva.region}
                onChange={(e) => setFormNueva({...formNueva, region: e.target.value})}
              />
            </div>

            <div>
              <Label>Tipo de Obra</Label>
              <Select value={formNueva.tipo} onValueChange={(value: any) => setFormNueva({...formNueva, tipo: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construccion">Construcción</SelectItem>
                  <SelectItem value="remodelacion">Remodelación</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cliente *</Label>
              <Input
                placeholder="Ej: Inmobiliaria ABC"
                value={formNueva.cliente}
                onChange={(e) => setFormNueva({...formNueva, cliente: e.target.value})}
              />
            </div>

            <div>
              <Label>Monto del Contrato *</Label>
              <Input
                type="number"
                placeholder="Ej: 850000000"
                value={formNueva.montoContrato}
                onChange={(e) => setFormNueva({...formNueva, montoContrato: e.target.value})}
              />
            </div>

            <div>
              <Label>Fecha de Inicio *</Label>
              <Input
                type="date"
                value={formNueva.fechaInicio}
                onChange={(e) => setFormNueva({...formNueva, fechaInicio: e.target.value})}
              />
            </div>

            <div>
              <Label>Fecha de Término (Estimada)</Label>
              <Input
                type="date"
                value={formNueva.fechaTermino}
                onChange={(e) => setFormNueva({...formNueva, fechaTermino: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción general del proyecto..."
                value={formNueva.descripcion}
                onChange={(e) => setFormNueva({...formNueva, descripcion: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNueva(false)}>Cancelar</Button>
            <Button className="text-white" style={{ backgroundColor: '#0066cc' }} onClick={crearObra}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Obra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

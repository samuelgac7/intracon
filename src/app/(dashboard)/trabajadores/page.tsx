"use client"

import TrabajadoresList from "@/components/TrabajadoresList"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { trabajadoresService } from "@/services/trabajadores"
import type { Trabajador } from "@/lib/supabase"
import { CARGOS_TRABAJADORES, BANCOS, AFPS, ISAPRES, REGIONES } from "@/constants/catalogos"
import { useDataRefreshEmitter } from "@/hooks/useDataRefresh"
import { useToast } from "@/components/ui/toast"
import { formatearRut, validarRut } from "@/lib/utils"

export default function TrabajadoresPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const { emitTrabajadorCreated } = useDataRefreshEmitter()
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogNuevo, setDialogNuevo] = useState(false)
  
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    rut: "",
    cargo: "",
    telefono: "",
    direccion: "",
    comuna: "",
    region: "",
    fechaIngreso: new Date().toISOString().split('T')[0],
    fechaTermino: "",
    salario: "",
    tipoContrato: "indefinido" as 'indefinido' | 'plazo-fijo' | 'obra' | 'honorarios',
    afp: "",
    prevision: "fonasa" as 'fonasa' | 'isapre',
    isapre: "",
    banco: "",
    tipoCuenta: "vista" as 'corriente' | 'vista' | 'rut',
    numeroCuenta: "",
    nacionalidad: "chilena" as 'chilena' | 'extranjera',
    estadoCivil: "soltero" as 'soltero' | 'casado' | 'viudo' | 'divorciado',
    asignacionColacion: 0,
    asignacionMovilizacion: 0,
    notas: ""
  })

  useEffect(() => {
    cargarTrabajadores()
  }, [])

  const cargarTrabajadores = async () => {
    try {
      const data = await trabajadoresService.getAll()
      setTrabajadores(data)
    } catch (error) {
      console.error('Error cargando trabajadores:', error)
      alert('Error al cargar trabajadores')
    } finally {
      setLoading(false)
    }
  }

  const crearTrabajador = async () => {
    if (!formNuevo.nombre || !formNuevo.rut || !formNuevo.cargo) {
      alert("Completa: Nombre, RUT y Cargo")
      return
    }

    try {
      const nuevoTrabajador: Omit<Trabajador, 'id' | 'fecha_creacion' | 'ultima_actualizacion'> = {
        nombre: formNuevo.nombre,
        rut: formNuevo.rut,
        cargo: formNuevo.cargo,
        fecha_ingreso: formNuevo.fechaIngreso,
        salario: formNuevo.salario,
        tipo_contrato: formNuevo.tipoContrato,
        tipo_jornada: 'completa', // Todos tienen jornada completa
        afp: formNuevo.afp || undefined,
        prevision: formNuevo.prevision,
        isapre: formNuevo.prevision === 'isapre' ? formNuevo.isapre || undefined : undefined,
        telefono: formNuevo.telefono || undefined,
        direccion: formNuevo.direccion || undefined,
        comuna: formNuevo.comuna || undefined,
        region: formNuevo.region || undefined,
        nacionalidad: formNuevo.nacionalidad,
        estado_civil: formNuevo.estadoCivil,
        banco: formNuevo.banco || undefined,
        tipo_cuenta: formNuevo.tipoCuenta || undefined,
        numero_cuenta: formNuevo.numeroCuenta || undefined,
        asignacion_colacion: formNuevo.asignacionColacion,
        asignacion_movilizacion: formNuevo.asignacionMovilizacion,
        estado: 'activo',
        notas: formNuevo.notas || undefined,
        foto: undefined
      }

      const trabajadorCreado = await trabajadoresService.create(nuevoTrabajador)

      // Actualizar lista local
      setTrabajadores([...trabajadores, trabajadorCreado])

      // Emitir evento para actualizar sidebar
      emitTrabajadorCreated()

      // Cerrar dialog
      setDialogNuevo(false)

      // Toast de éxito
      addToast({
        type: "success",
        title: "Trabajador creado",
        description: `${trabajadorCreado.nombre} ha sido registrado exitosamente`
      })

      // Reset form
      resetForm()

      // Navegar al detalle del trabajador recién creado
      router.push(`/trabajadores/${trabajadorCreado.id}`)

    } catch (error: any) {
      console.error('Error creando trabajador:', error)
      alert(`Error al crear trabajador: ${error.message || 'Error desconocido'}`)
    }
  }

  const resetForm = () => {
    setFormNuevo({
      nombre: "",
      rut: "",
      cargo: "",
      telefono: "",
      direccion: "",
      comuna: "",
      region: "",
      fechaIngreso: new Date().toISOString().split('T')[0],
      fechaTermino: "",
      salario: "",
      tipoContrato: "indefinido",
      afp: "",
      prevision: "fonasa",
      isapre: "",
      banco: "",
      tipoCuenta: "vista",
      numeroCuenta: "",
      nacionalidad: "chilena",
      estadoCivil: "soltero",
      asignacionColacion: 0,
      asignacionMovilizacion: 0,
      notas: ""
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando trabajadores...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Vista Solo Lista */}
      <div className="h-full">
        <TrabajadoresList
          onNuevoTrabajador={() => setDialogNuevo(true)}
        />
      </div>

      {/* Botón Flotante para Nuevo Trabajador */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg text-white"
        style={{ backgroundColor: '#0066cc' }}
        onClick={() => setDialogNuevo(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialog Nuevo Trabajador */}
      <Dialog open={dialogNuevo} onOpenChange={setDialogNuevo}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Nuevo Trabajador</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basico">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="laboral">Laboral</TabsTrigger>
              <TabsTrigger value="prevision">Previsión</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Nombre Completo *</Label>
                  <Input
                    placeholder="Juan Pérez González"
                    value={formNuevo.nombre}
                    onChange={(e) => setFormNuevo({...formNuevo, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <Label>RUT *</Label>
                  <Input
                    placeholder="12.345.678-9"
                    value={formNuevo.rut}
                    onChange={(e) => {
                      const rutFormateado = formatearRut(e.target.value)
                      setFormNuevo({...formNuevo, rut: rutFormateado})
                    }}
                  />
                  {formNuevo.rut && !validarRut(formNuevo.rut) && (
                    <p className="text-xs text-red-600 mt-1">RUT inválido</p>
                  )}
                </div>
                <div>
                  <Label>Cargo *</Label>
                  <Select value={formNuevo.cargo} onValueChange={(v) => setFormNuevo({...formNuevo, cargo: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {CARGOS_TRABAJADORES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input 
                    placeholder="+56 9 1234 5678"
                    value={formNuevo.telefono}
                    onChange={(e) => setFormNuevo({...formNuevo, telefono: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Dirección</Label>
                  <Input 
                    placeholder="Calle Ejemplo 123"
                    value={formNuevo.direccion}
                    onChange={(e) => setFormNuevo({...formNuevo, direccion: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Comuna</Label>
                  <Input 
                    placeholder="Las Condes"
                    value={formNuevo.comuna}
                    onChange={(e) => setFormNuevo({...formNuevo, comuna: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Región</Label>
                  <Select value={formNuevo.region} onValueChange={(v) => setFormNuevo({...formNuevo, region: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {REGIONES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="laboral" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Fecha de Ingreso</Label>
                  <Input 
                    type="date"
                    value={formNuevo.fechaIngreso}
                    onChange={(e) => setFormNuevo({...formNuevo, fechaIngreso: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Salario</Label>
                  <Input 
                    placeholder="$850.000"
                    value={formNuevo.salario}
                    onChange={(e) => setFormNuevo({...formNuevo, salario: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Tipo de Contrato</Label>
                  <Select value={formNuevo.tipoContrato} onValueChange={(v: any) => setFormNuevo({...formNuevo, tipoContrato: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                      <SelectItem value="plazo-fijo">Plazo Fijo</SelectItem>
                      <SelectItem value="obra">Por Obra</SelectItem>
                      <SelectItem value="honorarios">Honorarios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formNuevo.tipoContrato === 'plazo-fijo' && (
                  <div>
                    <Label>Fecha de Término del Contrato</Label>
                    <Input
                      type="date"
                      value={formNuevo.fechaTermino}
                      onChange={(e) => setFormNuevo({...formNuevo, fechaTermino: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <Label>Asignación Colación (Mensual)</Label>
                  <Input
                    type="number"
                    placeholder="250000"
                    value={formNuevo.asignacionColacion}
                    onChange={(e) => setFormNuevo({...formNuevo, asignacionColacion: parseFloat(e.target.value) || 0})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Se paga anticipadamente, prorratea primer mes</p>
                </div>
                <div>
                  <Label>Asignación Movilización (Mensual)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formNuevo.asignacionMovilizacion}
                    onChange={(e) => setFormNuevo({...formNuevo, asignacionMovilizacion: parseFloat(e.target.value) || 0})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Se paga anticipadamente, prorratea primer mes</p>
                </div>
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> Todos los trabajadores tienen jornada completa. Las horas extra se registrarán en el módulo de asistencia.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'none' }}>
                  <Label>Tipo de Jornada</Label>
                  <Select value="completa" disabled>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completa">Completa</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                      <SelectItem value="turno">Turno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nacionalidad</Label>
                  <Select value={formNuevo.nacionalidad} onValueChange={(v: any) => setFormNuevo({...formNuevo, nacionalidad: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chilena">Chilena</SelectItem>
                      <SelectItem value="extranjera">Extranjera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado Civil</Label>
                  <Select value={formNuevo.estadoCivil} onValueChange={(v: any) => setFormNuevo({...formNuevo, estadoCivil: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soltero">Soltero/a</SelectItem>
                      <SelectItem value="casado">Casado/a</SelectItem>
                      <SelectItem value="viudo">Viudo/a</SelectItem>
                      <SelectItem value="divorciado">Divorciado/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prevision" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>AFP</Label>
                  <Select value={formNuevo.afp} onValueChange={(v) => setFormNuevo({...formNuevo, afp: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {AFPS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Previsión de Salud</Label>
                  <Select value={formNuevo.prevision} onValueChange={(v: any) => setFormNuevo({...formNuevo, prevision: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fonasa">Fonasa</SelectItem>
                      <SelectItem value="isapre">Isapre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formNuevo.prevision === 'isapre' && (
                  <div>
                    <Label>Isapre</Label>
                    <Select value={formNuevo.isapre} onValueChange={(v) => setFormNuevo({...formNuevo, isapre: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {ISAPRES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Banco</Label>
                  <Select value={formNuevo.banco} onValueChange={(v) => setFormNuevo({...formNuevo, banco: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {BANCOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Cuenta</Label>
                  <Select value={formNuevo.tipoCuenta} onValueChange={(v: any) => setFormNuevo({...formNuevo, tipoCuenta: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corriente">Cuenta Corriente</SelectItem>
                      <SelectItem value="vista">Cuenta Vista</SelectItem>
                      <SelectItem value="rut">Cuenta RUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Cuenta</Label>
                  <Input 
                    placeholder="1234567890"
                    value={formNuevo.numeroCuenta}
                    onChange={(e) => setFormNuevo({...formNuevo, numeroCuenta: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNuevo(false)}>Cancelar</Button>
            <Button className="text-white" style={{ backgroundColor: '#0066cc' }} onClick={crearTrabajador}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Trabajador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
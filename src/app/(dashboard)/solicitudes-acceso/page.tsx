"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle2, XCircle, User, Mail, Calendar, AlertCircle, Shield } from "lucide-react"
import solicitudesAccesoService, { type SolicitudAcceso } from "@/services/solicitudesAcceso"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/toast"

export default function SolicitudesAccesoPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAcceso[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('pendiente')

  // Estado para modal de aprobación
  const [modalAprobar, setModalAprobar] = useState(false)
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAcceso | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [rutUsuario, setRutUsuario] = useState('')
  const [cargoUsuario, setCargoUsuario] = useState('')
  const [rolUsuario, setRolUsuario] = useState<'profesional' | 'gerente' | 'visitador' | 'super-admin'>('profesional')
  const [usernameUsuario, setUsernameUsuario] = useState('')
  const [passwordUsuario, setPasswordUsuario] = useState('')
  const [mensajeAprobacion, setMensajeAprobacion] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Estado para modal de rechazo
  const [modalRechazar, setModalRechazar] = useState(false)
  const [mensajeRechazo, setMensajeRechazo] = useState('')

  const { sesion } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    cargarSolicitudes()
  }, [filtro])

  const cargarSolicitudes = async () => {
    try {
      setLoading(true)
      console.log('📥 Cargando solicitudes con filtro:', filtro)

      const data = filtro === 'todas'
        ? await solicitudesAccesoService.getAll()
        : await solicitudesAccesoService.getAll().then(all => all.filter(s => s.estado === filtro))

      console.log('📊 Solicitudes obtenidas:', data.length, 'Estado de cada una:', data.map(s => ({ id: s.id, estado: s.estado })))

      setSolicitudes(data)
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes'
      })
    } finally {
      setLoading(false)
    }
  }

  const abrirModalAprobar = (solicitud: SolicitudAcceso) => {
    setSolicitudSeleccionada(solicitud)
    setNombreUsuario(solicitud.nombre)
    setRutUsuario('')
    setCargoUsuario('')
    setRolUsuario('profesional')
    // Generar username sugerido desde el email
    const usernameSugerido = solicitud.email.split('@')[0].toLowerCase()
    setUsernameUsuario(usernameSugerido)
    // Generar contraseña temporal aleatoria
    const passwordTemporal = `Temp${Math.random().toString(36).slice(-8)}!`
    setPasswordUsuario(passwordTemporal)
    setMensajeAprobacion(`¡Bienvenido/a ${solicitud.nombre}! Tu cuenta ha sido aprobada.\n\nUsuario: ${usernameSugerido}\nContraseña temporal: ${passwordTemporal}\n\nDeberás cambiar tu contraseña en el primer inicio de sesión.`)
    setModalAprobar(true)
  }

  const abrirModalRechazar = (solicitud: SolicitudAcceso) => {
    setSolicitudSeleccionada(solicitud)
    setMensajeRechazo('Lo sentimos, tu solicitud no fue aprobada en este momento.')
    setModalRechazar(true)
  }

  const handleAprobar = async () => {
    if (!solicitudSeleccionada || !sesion) return

    try {
      setProcesando(true)

      await solicitudesAccesoService.aprobar(
        solicitudSeleccionada.id,
        sesion.usuarioId,
        {
          nombre: nombreUsuario,
          email: solicitudSeleccionada.email,
          rut: rutUsuario || undefined,
          cargo: cargoUsuario || undefined,
          rol: rolUsuario
        },
        usernameUsuario,
        passwordUsuario,
        mensajeAprobacion
      )

      addToast({
        type: 'success',
        title: '¡Solicitud aprobada!',
        description: `${nombreUsuario} ahora tiene acceso al sistema`
      })

      setModalAprobar(false)
      setSolicitudSeleccionada(null)

      // Remover solicitud de la lista local inmediatamente
      setSolicitudes(prev => prev.filter(s => s.id !== solicitudSeleccionada.id))

      // Recargar desde servidor para asegurar sincronización
      await cargarSolicitudes()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'No se pudo aprobar la solicitud'
      console.error('Error aprobando solicitud:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setProcesando(false)
    }
  }

  const handleRechazar = async () => {
    if (!solicitudSeleccionada || !sesion) return

    console.log('🔴 Iniciando rechazo de solicitud:', solicitudSeleccionada.id)

    try {
      setProcesando(true)

      const resultado = await solicitudesAccesoService.rechazar(
        solicitudSeleccionada.id,
        sesion.usuarioId,
        mensajeRechazo
      )

      console.log('✅ Resultado del rechazo:', resultado)

      addToast({
        type: 'success',
        title: 'Solicitud rechazada',
        description: 'La solicitud ha sido rechazada correctamente'
      })

      const solicitudId = solicitudSeleccionada.id

      setModalRechazar(false)
      setSolicitudSeleccionada(null)

      // Remover solicitud de la lista local inmediatamente
      console.log('🔄 Removiendo solicitud de la lista local, ID:', solicitudId)
      setSolicitudes(prev => {
        const nuevaLista = prev.filter(s => s.id !== solicitudId)
        console.log('📋 Lista antes:', prev.length, 'Lista después:', nuevaLista.length)
        return nuevaLista
      })

      // Recargar desde servidor para asegurar sincronización
      console.log('🔄 Recargando solicitudes desde servidor...')
      await cargarSolicitudes()
      console.log('✅ Solicitudes recargadas')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'No se pudo rechazar la solicitud'
      console.error('Error rechazando solicitud:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setProcesando(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      case 'aprobada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aprobada
        </Badge>
      case 'rechazada':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Rechazada
        </Badge>
      default:
        return null
    }
  }

  // Verificar permisos
  if (!sesion || sesion.rol !== 'super-admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">Solo los super administradores pueden ver esta página</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Acceso</h1>
        <p className="text-gray-600 mt-2">Administra las solicitudes de nuevos usuarios</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={filtro === 'pendiente' ? 'default' : 'outline'}
              onClick={() => setFiltro('pendiente')}
              style={filtro === 'pendiente' ? { backgroundColor: '#0066cc' } : {}}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pendientes
            </Button>
            <Button
              variant={filtro === 'aprobada' ? 'default' : 'outline'}
              onClick={() => setFiltro('aprobada')}
              style={filtro === 'aprobada' ? { backgroundColor: '#0066cc' } : {}}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprobadas
            </Button>
            <Button
              variant={filtro === 'rechazada' ? 'default' : 'outline'}
              onClick={() => setFiltro('rechazada')}
              style={filtro === 'rechazada' ? { backgroundColor: '#0066cc' } : {}}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazadas
            </Button>
            <Button
              variant={filtro === 'todas' ? 'default' : 'outline'}
              onClick={() => setFiltro('todas')}
              style={filtro === 'todas' ? { backgroundColor: '#0066cc' } : {}}
            >
              Todas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de solicitudes */}
      {loading ? (
        <div className="text-center py-12">
          <div className="spinner h-12 w-12 mx-auto mb-4" style={{ borderTopColor: '#0066cc' }}></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No hay solicitudes</h2>
            <p className="text-gray-600">
              {filtro === 'pendiente'
                ? 'No hay solicitudes pendientes de revisión'
                : `No hay solicitudes con estado "${filtro}"`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map((solicitud) => (
            <Card key={solicitud.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      {solicitud.nombre}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {solicitud.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-CL')}
                      </span>
                    </CardDescription>
                  </div>
                  {getEstadoBadge(solicitud.estado)}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Proveedor: </span>
                      <span className="font-medium">{solicitud.auth_provider}</span>
                    </div>
                    {solicitud.rol_solicitado && (
                      <div>
                        <span className="text-gray-600">Rol solicitado: </span>
                        <span className="font-medium">{solicitud.rol_solicitado}</span>
                      </div>
                    )}
                  </div>

                  {solicitud.mensaje_solicitud && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{solicitud.mensaje_solicitud}</p>
                    </div>
                  )}

                  {solicitud.mensaje_admin && (
                    <div className={`p-3 rounded-lg ${
                      solicitud.estado === 'aprobada' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <p className="text-sm font-medium mb-1">Respuesta del administrador:</p>
                      <p className="text-sm text-gray-700">{solicitud.mensaje_admin}</p>
                    </div>
                  )}

                  {solicitud.estado === 'pendiente' && (
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <Button
                        onClick={() => abrirModalAprobar(solicitud)}
                        className="w-full text-white"
                        style={{ backgroundColor: '#10b981' }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => abrirModalRechazar(solicitud)}
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Aprobar */}
      <Dialog open={modalAprobar} onOpenChange={setModalAprobar}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Aprobar Solicitud de Acceso</DialogTitle>
            <DialogDescription className="text-gray-600">
              Completa la información del nuevo usuario para crear su cuenta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Ej: Juan Pérez González"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={rutUsuario}
                  onChange={(e) => setRutUsuario(e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={cargoUsuario}
                  onChange={(e) => setCargoUsuario(e.target.value)}
                  placeholder="Ej: Ingeniero, Contador, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol en el sistema *</Label>
              <Select value={rolUsuario} onValueChange={(value: any) => setRolUsuario(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profesional">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Profesional
                    </div>
                  </SelectItem>
                  <SelectItem value="visitador">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Visitador
                    </div>
                  </SelectItem>
                  <SelectItem value="gerente">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Gerente
                    </div>
                  </SelectItem>
                  <SelectItem value="super-admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Super Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario *</Label>
                <Input
                  id="username"
                  value={usernameUsuario}
                  onChange={(e) => setUsernameUsuario(e.target.value)}
                  placeholder="Ej: jperez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña temporal *</Label>
                <Input
                  id="password"
                  value={passwordUsuario}
                  onChange={(e) => setPasswordUsuario(e.target.value)}
                  placeholder="Contraseña temporal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje de bienvenida</Label>
              <Textarea
                id="mensaje"
                value={mensajeAprobacion}
                onChange={(e) => setMensajeAprobacion(e.target.value)}
                rows={3}
                placeholder="Mensaje que recibirá el usuario"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAprobar(false)} disabled={procesando}>
              Cancelar
            </Button>
            <Button
              onClick={handleAprobar}
              disabled={procesando || !nombreUsuario || !usernameUsuario || !passwordUsuario}
              style={{ backgroundColor: '#10b981' }}
              className="text-white"
            >
              {procesando ? (
                <>
                  <div className="spinner h-4 w-4 mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprobar y Crear Cuenta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Rechazar */}
      <Dialog open={modalRechazar} onOpenChange={setModalRechazar}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Rechazar Solicitud</DialogTitle>
            <DialogDescription className="text-gray-600">
              Proporciona un mensaje explicando por qué se rechaza la solicitud
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mensaje-rechazo">Mensaje para el usuario</Label>
              <Textarea
                id="mensaje-rechazo"
                value={mensajeRechazo}
                onChange={(e) => setMensajeRechazo(e.target.value)}
                rows={4}
                placeholder="Explica por qué se rechaza la solicitud"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setModalRechazar(false)}
              disabled={procesando}
              className="min-w-[120px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRechazar}
              disabled={procesando}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[180px]"
            >
              {procesando ? (
                <>
                  <div className="spinner h-4 w-4 mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

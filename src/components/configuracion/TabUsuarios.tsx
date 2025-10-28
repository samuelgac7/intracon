"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useState, useEffect } from 'react'
import {
  Plus, Search, UserPlus, Ban, CheckCircle, Key,
  AlertCircle, Users as UsersIcon, Eye, EyeOff, RefreshCw, Building2
} from 'lucide-react'
import * as usuariosService from '@/services/usuarios'
import { obrasService } from '@/services/obras'
import type { Usuario, Obra } from '@/lib/supabase'
import { CARGOS_USUARIOS } from '@/constants/catalogos'
import { Checkbox } from '@/components/ui/checkbox'

export default function TabUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('todos')

  // Dialogs
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogResetPassword, setDialogResetPassword] = useState(false)
  const [dialogObrasAsignadas, setDialogObrasAsignadas] = useState(false)

  // Usuario seleccionado
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [obrasSeleccionadas, setObrasSeleccionadas] = useState<number[] | null>(null)

  // Form crear usuario
  const [formCrear, setFormCrear] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    cargo: '',
    username: '',
    password: '',
    rol: 'profesional' as Usuario['rol']
  })

  const [showPassword, setShowPassword] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [mustChangePassword, setMustChangePassword] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [usuariosData, obrasData] = await Promise.all([
        usuariosService.getAll(),
        obrasService.getAll()
      ])
      setUsuarios(usuariosData)
      setObras(obrasData)
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const cargarUsuarios = async () => {
    try {
      const data = await usuariosService.getAll()
      setUsuarios(data)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      alert('Error al cargar usuarios')
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.credenciales?.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.cargo?.toLowerCase().includes(busqueda.toLowerCase())

    const coincideRol = filtroRol === 'todos' || u.rol === filtroRol

    return coincideBusqueda && coincideRol
  })

  const generarUsername = (nombre: string) => {
    const partes = nombre.toLowerCase().trim().split(' ')
    const username = `${partes[0]?.charAt(0) || ''}${partes[1] || ''}`
      .replace(/[^a-z0-9]/g, '')

    // Verificar si existe
    let finalUsername = username
    let contador = 1
    while (usuarios.some(u => u.credenciales?.username === finalUsername)) {
      finalUsername = `${username}${contador}`
      contador++
    }

    return finalUsername
  }

  const generarPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleCrearUsuario = async () => {
    if (!formCrear.nombre || !formCrear.rut || !formCrear.email || !formCrear.username || !formCrear.password) {
      alert('Complete los campos obligatorios: Nombre, RUT, Email, Usuario y Contraseña')
      return
    }

    try {
      const nuevoUsuario: Omit<Usuario, 'id' | 'fecha_creacion' | 'ultima_actualizacion'> = {
        nombre: formCrear.nombre,
        rut: formCrear.rut,
        email: formCrear.email,
        telefono: formCrear.telefono || undefined,
        cargo: formCrear.cargo || undefined,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        activo: true,
        rol: formCrear.rol,
        credenciales: {
          username: formCrear.username,
          passwordHash: '', // Will be set by create()
          mustChangePassword: true,
          ultimoAcceso: undefined,
          intentosFallidos: 0
        },
        permisos: usuariosService.getPermisosDefectoPorRol(formCrear.rol)
      }

      await usuariosService.create(nuevoUsuario, formCrear.password)
      await cargarUsuarios()
      setDialogCrear(false)

      alert(`✅ Usuario creado exitosamente\n\nUsuario: ${formCrear.username}\nContraseña: ${formCrear.password}\n\n⚠️ Guarde esta información, el usuario deberá cambiar su contraseña en el primer acceso.`)

      // Reset form
      setFormCrear({
        nombre: '',
        rut: '',
        email: '',
        telefono: '',
        cargo: '',
        username: '',
        password: '',
        rol: 'profesional'
      })
    } catch (error: unknown) {
      console.error('Error creando usuario:', error)
      alert(`Error al crear usuario: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleCambiarRol = async (usuario: Usuario, nuevoRol: Usuario['rol']) => {
    if (!confirm(`¿Cambiar rol de ${usuario.nombre} a ${getRolTexto(nuevoRol)}?`)) return

    try {
      await usuariosService.changeRol(usuario.id, nuevoRol)
      await cargarUsuarios()
      alert('Rol actualizado exitosamente')
    } catch (error: unknown) {
      console.error('Error cambiando rol:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDesactivar = async (usuario: Usuario) => {
    if (!confirm(`¿Desactivar el acceso de ${usuario.nombre}?`)) return

    try {
      await usuariosService.update(usuario.id, { activo: false })
      await cargarUsuarios()
      alert('Usuario desactivado')
    } catch (error: unknown) {
      console.error('Error desactivando usuario:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleReactivar = async (usuario: Usuario) => {
    if (!confirm(`¿Reactivar el acceso de ${usuario.nombre}?`)) return

    try {
      await usuariosService.activate(usuario.id)
      await cargarUsuarios()
      alert('Usuario reactivado')
    } catch (error: unknown) {
      console.error('Error reactivando usuario:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleResetPassword = async () => {
    if (!usuarioSeleccionado || !nuevaPassword) {
      alert('Ingrese una contraseña')
      return
    }

    try {
      await usuariosService.changePassword(usuarioSeleccionado.id, nuevaPassword, mustChangePassword)
      await cargarUsuarios()
      setDialogResetPassword(false)
      setNuevaPassword('')

      alert(`✅ Contraseña restablecida\n\nNueva contraseña: ${nuevaPassword}\n${mustChangePassword ? 'El usuario deberá cambiarla en su próximo acceso.' : ''}`)
    } catch (error: unknown) {
      console.error('Error restableciendo contraseña:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleGestionarObras = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario)
    setObrasSeleccionadas(usuario.obras_asignadas || [])
    setDialogObrasAsignadas(true)
  }

  const handleGuardarObrasAsignadas = async () => {
    if (!usuarioSeleccionado) return

    try {
      await usuariosService.update(usuarioSeleccionado.id, {
        obras_asignadas: obrasSeleccionadas
      })
      await cargarUsuarios()
      setDialogObrasAsignadas(false)
      alert('Obras asignadas actualizadas exitosamente')
    } catch (error: unknown) {
      console.error('Error actualizando obras asignadas:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const toggleObra = (obraId: number) => {
    if (obrasSeleccionadas === null) {
      // Si es null (todas las obras), al hacer toggle creamos un array con todas menos la que se deselecciona
      setObrasSeleccionadas(obras.filter(o => o.id !== obraId).map(o => o.id))
    } else {
      if (obrasSeleccionadas.includes(obraId)) {
        const nuevas = obrasSeleccionadas.filter(id => id !== obraId)
        setObrasSeleccionadas(nuevas.length > 0 ? nuevas : [])
      } else {
        setObrasSeleccionadas([...obrasSeleccionadas, obraId])
      }
    }
  }

  const toggleTodasLasObras = () => {
    setObrasSeleccionadas(null) // null significa "todas las obras"
  }

  const getRolTexto = (rol: Usuario['rol']) => {
    const roles: Record<Usuario['rol'], string> = {
      'profesional': 'Profesional',
      'visitador': 'Visitador',
      'gerente': 'Gerente',
      'super-admin': 'Super Admin'
    }
    return roles[rol]
  }

  const getRolColor = (rol: Usuario['rol']) => {
    const colors: Record<Usuario['rol'], string> = {
      'profesional': 'bg-green-100 text-green-800',
      'visitador': 'bg-blue-100 text-blue-800',
      'gerente': 'bg-purple-100 text-purple-800',
      'super-admin': 'bg-red-100 text-red-800'
    }
    return colors[rol]
  }

  const estadisticas = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length,
    profesionales: usuarios.filter(u => u.rol === 'profesional').length,
    visitadores: usuarios.filter(u => u.rol === 'visitador').length,
    gerentes: usuarios.filter(u => u.rol === 'gerente').length,
    superAdmins: usuarios.filter(u => u.rol === 'super-admin').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
            <div className="text-sm text-gray-600">Total Usuarios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
            <div className="text-sm text-gray-600">Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{estadisticas.gerentes}</div>
            <div className="text-sm text-gray-600">Gerentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{estadisticas.superAdmins}</div>
            <div className="text-sm text-gray-600">Super Admins</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <Button
              onClick={() => setDialogCrear(true)}
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, usuario o cargo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroRol} onValueChange={setFiltroRol}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="profesional">Profesionales</SelectItem>
                <SelectItem value="visitador">Visitadores</SelectItem>
                <SelectItem value="gerente">Gerentes</SelectItem>
                <SelectItem value="super-admin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-2">
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((usuario) => (
                <Card key={usuario.id} className={`${!usuario.activo ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{usuario.nombre}</div>
                          <div className="text-sm text-gray-600">
                            @{usuario.credenciales.username} • {usuario.cargo || 'Sin cargo'}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getRolColor(usuario.rol)}>
                              {getRolTexto(usuario.rol)}
                            </Badge>
                            {!usuario.activo && (
                              <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                            )}
                            {usuario.credenciales.mustChangePassword && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Key className="h-3 w-3 mr-1" />
                                Debe cambiar contraseña
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Select
                          value={usuario.rol}
                          onValueChange={(v) => handleCambiarRol(usuario, v as Usuario['rol'])}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="profesional">Profesional</SelectItem>
                            <SelectItem value="visitador">Visitador</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="super-admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGestionarObras(usuario)}
                          title="Gestionar obras asignadas"
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUsuarioSeleccionado(usuario)
                            setNuevaPassword(generarPassword())
                            setMustChangePassword(true)
                            setDialogResetPassword(true)
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>

                        {usuario.activo ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDesactivar(usuario)}
                          >
                            <Ban className="h-4 w-4 text-red-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivar(usuario)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No se encontraron usuarios</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Crear Usuario */}
      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={formCrear.nombre}
                  onChange={(e) => {
                    setFormCrear({...formCrear, nombre: e.target.value})
                    if (e.target.value && !formCrear.username) {
                      setFormCrear({
                        ...formCrear,
                        nombre: e.target.value,
                        username: generarUsername(e.target.value)
                      })
                    }
                  }}
                  placeholder="Juan Pérez González"
                />
              </div>
              <div>
                <Label>RUT *</Label>
                <Input
                  value={formCrear.rut}
                  onChange={(e) => setFormCrear({...formCrear, rut: e.target.value})}
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formCrear.email}
                  onChange={(e) => setFormCrear({...formCrear, email: e.target.value})}
                  placeholder="usuario@tecnycon.cl"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formCrear.telefono}
                  onChange={(e) => setFormCrear({...formCrear, telefono: e.target.value})}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo</Label>
                <Select value={formCrear.cargo} onValueChange={(v) => setFormCrear({...formCrear, cargo: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGOS_USUARIOS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rol *</Label>
                <Select value={formCrear.rol} onValueChange={(v) => setFormCrear({...formCrear, rol: v as Usuario['rol']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profesional">Profesional</SelectItem>
                    <SelectItem value="visitador">Visitador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-semibold mb-4">Credenciales de Acceso</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex justify-between items-center">
                    Usuario *
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFormCrear({
                        ...formCrear,
                        username: generarUsername(formCrear.nombre)
                      })}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerar
                    </Button>
                  </Label>
                  <Input
                    value={formCrear.username}
                    onChange={(e) => setFormCrear({
                      ...formCrear,
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
                    })}
                    placeholder="jperez"
                  />
                </div>
                <div>
                  <Label className="flex justify-between items-center">
                    Contraseña Temporal *
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFormCrear({...formCrear, password: generarPassword()})}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Nueva
                    </Button>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formCrear.password}
                      onChange={(e) => setFormCrear({...formCrear, password: e.target.value})}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  El usuario deberá cambiar su contraseña en el primer acceso por seguridad.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCrear(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearUsuario}
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Reset Password */}
      <Dialog open={dialogResetPassword} onOpenChange={setDialogResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Restableciendo contraseña para: <strong>{usuarioSeleccionado?.nombre}</strong>
              </AlertDescription>
            </Alert>

            <div>
              <Label className="flex justify-between items-center mb-2">
                Nueva Contraseña
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNuevaPassword(generarPassword())}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generar
                </Button>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mustChange"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: '#0066cc' }}
              />
              <Label htmlFor="mustChange" className="cursor-pointer">
                Requerir cambio de contraseña en próximo acceso
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogResetPassword(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
            >
              <Key className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestionar Obras Asignadas */}
      <Dialog open={dialogObrasAsignadas} onOpenChange={setDialogObrasAsignadas}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Obras Asignadas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Configurando acceso a obras para: <strong>{usuarioSeleccionado?.nombre}</strong>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="todas-obras"
                  checked={obrasSeleccionadas === null}
                  onCheckedChange={() => toggleTodasLasObras()}
                  style={{ accentColor: '#0066cc' }}
                />
                <Label htmlFor="todas-obras" className="cursor-pointer font-semibold">
                  Acceso a todas las obras
                </Label>
              </div>
              <p className="text-xs text-blue-700 mt-2 ml-6">
                Al seleccionar esta opción, el usuario tendrá acceso a todas las obras existentes y futuras.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Obras Específicas ({obras.length})</h4>
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {obras.map((obra) => {
                  const isChecked = obrasSeleccionadas === null || (obrasSeleccionadas?.includes(obra.id) ?? false)
                  return (
                    <div
                      key={obra.id}
                      className={`p-3 border rounded-lg transition-all ${
                        isChecked ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`obra-${obra.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleObra(obra.id)}
                          disabled={obrasSeleccionadas === null}
                          style={{ accentColor: '#0066cc' }}
                        />
                        <Label
                          htmlFor={`obra-${obra.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{obra.nombre}</div>
                          <div className="text-xs text-gray-500">
                            {obra.comuna}, {obra.region} • {obra.estado}
                          </div>
                        </Label>
                      </div>
                    </div>
                  )
                })}
              </div>

              {obrasSeleccionadas !== null && obrasSeleccionadas.length === 0 && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    ⚠️ El usuario no tendrá acceso a ninguna obra. Seleccione al menos una obra o active &quot;Acceso a todas las obras&quot;.
                  </AlertDescription>
                </Alert>
              )}

              {obrasSeleccionadas !== null && obrasSeleccionadas.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ {obrasSeleccionadas.length} obra{obrasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{obrasSeleccionadas.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogObrasAsignadas(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarObrasAsignadas}
              className="text-white"
              style={{ backgroundColor: '#0066cc' }}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Guardar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

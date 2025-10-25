"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, Eye, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { useState } from 'react'

interface Permiso {
  modulo: string
  accion: string
  descripcion: string
}

interface RolPermisos {
  rol: string
  nombre: string
  descripcion: string
  color: string
  nivel: number
  permisos: Record<string, string[]>
}

export default function TabPermisos() {
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('super-admin')

  const modulos = [
    {
      id: 'dashboard',
      nombre: 'Dashboard',
      icon: '📊',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver dashboard y estadísticas' }
      ]
    },
    {
      id: 'trabajadores',
      nombre: 'Trabajadores',
      icon: '👷',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver lista y detalles de trabajadores' },
        { id: 'create', nombre: 'Crear', descripcion: 'Registrar nuevos trabajadores' },
        { id: 'update', nombre: 'Editar', descripcion: 'Modificar información de trabajadores' },
        { id: 'delete', nombre: 'Eliminar', descripcion: 'Eliminar trabajadores del sistema' }
      ]
    },
    {
      id: 'obras',
      nombre: 'Obras',
      icon: '🏗️',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver lista y detalles de obras' },
        { id: 'create', nombre: 'Crear', descripcion: 'Crear nuevas obras' },
        { id: 'update', nombre: 'Editar', descripcion: 'Modificar información de obras' },
        { id: 'delete', nombre: 'Eliminar', descripcion: 'Eliminar obras' },
        { id: 'manage', nombre: 'Gestionar', descripcion: 'Asignar trabajadores, gastos, hitos' }
      ]
    },
    {
      id: 'contratos',
      nombre: 'Contratos',
      icon: '📄',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver contratos' },
        { id: 'create', nombre: 'Crear', descripcion: 'Generar nuevos contratos' },
        { id: 'update', nombre: 'Editar', descripcion: 'Modificar contratos' },
        { id: 'delete', nombre: 'Eliminar', descripcion: 'Eliminar contratos' },
        { id: 'sign', nombre: 'Firmar', descripcion: 'Firmar y finalizar contratos' }
      ]
    },
    {
      id: 'documentos',
      nombre: 'Documentos',
      icon: '📁',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver y descargar documentos' },
        { id: 'upload', nombre: 'Subir', descripcion: 'Subir nuevos documentos' },
        { id: 'delete', nombre: 'Eliminar', descripcion: 'Eliminar documentos' }
      ]
    },
    {
      id: 'finanzas',
      nombre: 'Finanzas',
      icon: '💰',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver información financiera' },
        { id: 'create', nombre: 'Crear', descripcion: 'Registrar gastos e ingresos' },
        { id: 'update', nombre: 'Editar', descripcion: 'Modificar registros financieros' },
        { id: 'reports', nombre: 'Reportes', descripcion: 'Generar reportes financieros' }
      ]
    },
    {
      id: 'usuarios',
      nombre: 'Usuarios',
      icon: '👥',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver lista de usuarios' },
        { id: 'create', nombre: 'Crear', descripcion: 'Crear nuevos usuarios' },
        { id: 'update', nombre: 'Editar', descripcion: 'Modificar usuarios' },
        { id: 'delete', nombre: 'Eliminar', descripcion: 'Desactivar usuarios' },
        { id: 'manage-roles', nombre: 'Roles', descripcion: 'Cambiar roles de usuarios' }
      ]
    },
    {
      id: 'configuracion',
      nombre: 'Configuración',
      icon: '⚙️',
      acciones: [
        { id: 'read', nombre: 'Ver', descripcion: 'Ver configuración' },
        { id: 'update', nombre: 'Editar', descripcion: 'Modificar configuración del sistema' },
        { id: 'backup', nombre: 'Respaldos', descripcion: 'Crear y restaurar respaldos' }
      ]
    }
  ]

  const rolesPermisos: RolPermisos[] = [
    {
      rol: 'super-admin',
      nombre: 'Super Administrador',
      descripcion: 'Acceso total al sistema. Control completo de usuarios, configuración y datos.',
      color: 'bg-red-100 text-red-800 border-red-200',
      nivel: 5,
      permisos: {
        dashboard: ['read'],
        trabajadores: ['read', 'create', 'update', 'delete'],
        obras: ['read', 'create', 'update', 'delete', 'manage'],
        contratos: ['read', 'create', 'update', 'delete', 'sign'],
        documentos: ['read', 'upload', 'delete'],
        finanzas: ['read', 'create', 'update', 'reports'],
        usuarios: ['read', 'create', 'update', 'delete', 'manage-roles'],
        configuracion: ['read', 'update', 'backup']
      }
    },
    {
      rol: 'gerente',
      nombre: 'Gerente',
      descripcion: 'Acceso gerencial completo. Gestión de personal, obras y finanzas.',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      nivel: 4,
      permisos: {
        dashboard: ['read'],
        trabajadores: ['read', 'create', 'update'],
        obras: ['read', 'create', 'update', 'manage'],
        contratos: ['read', 'create', 'update', 'sign'],
        documentos: ['read', 'upload', 'delete'],
        finanzas: ['read', 'create', 'update', 'reports'],
        usuarios: ['read', 'create'],
        configuracion: ['read']
      }
    },
    {
      rol: 'administrador',
      nombre: 'Administrador',
      descripcion: 'Gestión operativa completa. Control de trabajadores, obras y contratos.',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      nivel: 3,
      permisos: {
        dashboard: ['read'],
        trabajadores: ['read', 'create', 'update'],
        obras: ['read', 'create', 'update', 'manage'],
        contratos: ['read', 'create', 'update'],
        documentos: ['read', 'upload'],
        finanzas: ['read'],
        usuarios: ['read'],
        configuracion: ['read']
      }
    },
    {
      rol: 'supervisor',
      nombre: 'Supervisor',
      descripcion: 'Supervisión de obras. Gestión de trabajadores asignados y avance de proyectos.',
      color: 'bg-green-100 text-green-800 border-green-200',
      nivel: 2,
      permisos: {
        dashboard: ['read'],
        trabajadores: ['read', 'update'],
        obras: ['read', 'update', 'manage'],
        contratos: ['read'],
        documentos: ['read', 'upload'],
        finanzas: ['read'],
        usuarios: [],
        configuracion: []
      }
    },
    {
      rol: 'usuario',
      nombre: 'Usuario',
      descripcion: 'Acceso básico de consulta. Visualización de información personal y obras asignadas.',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      nivel: 1,
      permisos: {
        dashboard: ['read'],
        trabajadores: ['read'],
        obras: ['read'],
        contratos: ['read'],
        documentos: ['read'],
        finanzas: [],
        usuarios: [],
        configuracion: []
      }
    }
  ]

  const rolActual = rolesPermisos.find(r => r.rol === rolSeleccionado)

  const tienePermiso = (moduloId: string, accionId: string): boolean => {
    if (!rolActual) return false
    const permisosModulo = rolActual.permisos[moduloId] || []
    return permisosModulo.includes(accionId)
  }

  const getIconoAccion = (accionId: string) => {
    const iconos: Record<string, React.ReactNode> = {
      read: <Eye className="h-3 w-3" />,
      create: <Edit className="h-3 w-3" />,
      update: <Edit className="h-3 w-3" />,
      delete: <Trash2 className="h-3 w-3" />,
      manage: <Shield className="h-3 w-3" />,
      upload: <Edit className="h-3 w-3" />,
      sign: <CheckCircle className="h-3 w-3" />,
      reports: <Eye className="h-3 w-3" />,
      'manage-roles': <Shield className="h-3 w-3" />,
      backup: <Shield className="h-3 w-3" />
    }
    return iconos[accionId] || <Lock className="h-3 w-3" />
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema de Permisos:</strong> Define qué acciones puede realizar cada rol en el sistema. 
          Los permisos se heredan jerárquicamente de mayor a menor nivel.
        </AlertDescription>
      </Alert>

      {/* Selector de Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rolesPermisos.map((rol) => (
              <Card
                key={rol.rol}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  rolSeleccionado === rol.rol 
                    ? 'ring-2 ring-blue-500 shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setRolSeleccionado(rol.rol)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${rol.color.split(' ')[0]}`}>
                        <Shield className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1">{rol.nombre}</h4>
                      <p className="text-xs text-gray-600 mb-2">{rol.descripcion}</p>
                      <Badge className={rol.color} variant="outline">
                        Nivel {rol.nivel}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Permisos */}
      {rolActual && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Permisos: {rolActual.nombre}</CardTitle>
              <Badge className={rolActual.color} variant="outline">
                Nivel {rolActual.nivel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {modulos.map((modulo) => {
                const permisosModulo = rolActual.permisos[modulo.id] || []
                const tieneAlgunPermiso = permisosModulo.length > 0

                return (
                  <div key={modulo.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{modulo.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold">{modulo.nombre}</h4>
                        {!tieneAlgunPermiso && (
                          <p className="text-xs text-red-600">Sin permisos en este módulo</p>
                        )}
                      </div>
                      {tieneAlgunPermiso && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {permisosModulo.length} permiso{permisosModulo.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {modulo.acciones.map((accion) => {
                        const tiene = tienePermiso(modulo.id, accion.id)
                        
                        return (
                          <div
                            key={accion.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              tiene 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {tiene ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getIconoAccion(accion.id)}
                                <span className={`text-sm font-medium ${tiene ? 'text-green-800' : 'text-gray-600'}`}>
                                  {accion.nombre}
                                </span>
                              </div>
                              <p className={`text-xs ${tiene ? 'text-green-700' : 'text-gray-500'}`}>
                                {accion.descripcion}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      {rolActual && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Resumen de Permisos</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>• <strong>Total de módulos:</strong> {modulos.length}</p>
                  <p>• <strong>Módulos con acceso:</strong> {Object.keys(rolActual.permisos).filter(m => rolActual.permisos[m].length > 0).length}</p>
                  <p>• <strong>Total de permisos:</strong> {Object.values(rolActual.permisos).flat().length}</p>
                  <p className="mt-2 pt-2 border-t border-blue-200">
                    {rolActual.rol === 'super-admin' 
                      ? '🔓 Acceso total sin restricciones'
                      : `🔒 Acceso limitado según rol ${rolActual.nombre}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
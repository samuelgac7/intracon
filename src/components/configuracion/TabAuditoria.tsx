"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import {
  History, Search, Download, Filter, Calendar, User,
  Shield, FileText, Building2, Users, Settings, Activity,
  Clock, AlertCircle, CheckCircle, XCircle, LogIn, LogOut
} from 'lucide-react'
import * as usuariosService from '@/services/usuarios'
import { trabajadoresService } from '@/services/trabajadores'
import type { Trabajador } from '@/lib/supabase'

interface LogAuditoria {
  id: number
  usuario_id: number
  accion: string
  modulo: string
  detalles?: string
  ip?: string
  user_agent?: string
  fecha: string
  trabajadores?: {
    nombre: string
    rut: string
    cargo: string
  }
}

export default function TabAuditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [usuarios, setUsuarios] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos')
  const [filtroModulo, setFiltroModulo] = useState<string>('todos')
  const [filtroAccion, setFiltroAccion] = useState<string>('todas')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const usuariosData = await usuariosService.getAll()
      setUsuarios(usuariosData)
      // TODO: Implementar getLogs cuando el servicio de auditoría esté disponible
      setLogs([])
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar datos de auditoría')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = async () => {
    setLoading(true)
    try {
      // TODO: Implementar getLogs cuando el servicio de auditoría esté disponible
      const logsData: LogAuditoria[] = []
      /*
      const logsData = await usuariosService.getLogs({
        usuarioId: filtroUsuario !== 'todos' ? parseInt(filtroUsuario) : undefined,
        modulo: filtroModulo !== 'todos' ? filtroModulo : undefined,
        accion: filtroAccion !== 'todas' ? filtroAccion : undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        limit: 100
      })
      */
      
      setLogs(logsData as LogAuditoria[])
    } catch (error) {
      console.error('Error aplicando filtros:', error)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFiltros = () => {
    setFiltroUsuario('todos')
    setFiltroModulo('todos')
    setFiltroAccion('todas')
    setFechaDesde('')
    setFechaHasta('')
    setBusqueda('')
    cargarDatos()
  }

  const exportarLogs = async () => {
    try {
      const XLSX = await import('xlsx')
      const datos = logs.map(log => ({
        'Fecha': new Date(log.fecha).toLocaleString('es-CL'),
        'Usuario': log.trabajadores?.nombre || 'Sistema',
        'RUT': log.trabajadores?.rut || '-',
        'Acción': log.accion,
        'Módulo': log.modulo,
        'Detalles': log.detalles || '-',
        'IP': log.ip || '-'
      }))
      
      const ws = XLSX.utils.json_to_sheet(datos)
      ws['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 40 },
        { wch: 15 }
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Logs Auditoría")
      XLSX.writeFile(wb, `Logs_Auditoria_${new Date().toISOString().split('T')[0]}.xlsx`)
      
      alert(`Excel generado: ${datos.length} registros`)
    } catch (error) {
      alert('Error al generar Excel')
    }
  }

  const logsFiltrados = logs.filter(log => {
    if (!busqueda) return true
    
    const busquedaLower = busqueda.toLowerCase()
    return (
      log.trabajadores?.nombre.toLowerCase().includes(busquedaLower) ||
      log.accion.toLowerCase().includes(busquedaLower) ||
      log.modulo.toLowerCase().includes(busquedaLower) ||
      log.detalles?.toLowerCase().includes(busquedaLower)
    )
  })

  const getIconoModulo = (modulo: string) => {
    const iconos: Record<string, React.ReactNode> = {
      usuarios: <Users className="h-4 w-4" />,
      trabajadores: <User className="h-4 w-4" />,
      obras: <Building2 className="h-4 w-4" />,
      contratos: <FileText className="h-4 w-4" />,
      documentos: <FileText className="h-4 w-4" />,
      finanzas: <Activity className="h-4 w-4" />,
      configuracion: <Settings className="h-4 w-4" />,
      sistema: <Shield className="h-4 w-4" />
    }
    return iconos[modulo] || <Activity className="h-4 w-4" />
  }

  const getIconoAccion = (accion: string) => {
    if (accion.includes('login') && !accion.includes('fallido')) {
      return <LogIn className="h-4 w-4 text-green-600" />
    }
    if (accion.includes('logout')) {
      return <LogOut className="h-4 w-4 text-gray-600" />
    }
    if (accion.includes('crear')) {
      return <CheckCircle className="h-4 w-4 text-blue-600" />
    }
    if (accion.includes('eliminar') || accion.includes('desactivar')) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    if (accion.includes('fallido')) {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getColorAccion = (accion: string) => {
    if (accion.includes('login') && !accion.includes('fallido')) {
      return 'bg-green-100 text-green-800'
    }
    if (accion.includes('crear')) {
      return 'bg-blue-100 text-blue-800'
    }
    if (accion.includes('eliminar') || accion.includes('desactivar')) {
      return 'bg-red-100 text-red-800'
    }
    if (accion.includes('fallido')) {
      return 'bg-red-100 text-red-800'
    }
    if (accion.includes('editar') || accion.includes('actualizar')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const estadisticas = {
    total: logs.length,
    ultimas24h: logs.filter(l => {
      const diff = Date.now() - new Date(l.fecha).getTime()
      return diff < 24 * 60 * 60 * 1000
    }).length,
    usuarios: new Set(logs.map(l => l.usuario_id)).size,
    acciones: {
      logins: logs.filter(l => l.accion === 'login').length,
      creaciones: logs.filter(l => l.accion.includes('crear')).length,
      modificaciones: logs.filter(l => l.accion.includes('editar') || l.accion.includes('actualizar')).length,
      eliminaciones: logs.filter(l => l.accion.includes('eliminar') || l.accion.includes('desactivar')).length
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando logs...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Eventos</p>
                <p className="text-2xl font-bold">{estadisticas.total}</p>
              </div>
              <History className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Últimas 24h</p>
                <p className="text-2xl font-bold">{estadisticas.ultimas24h}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuarios Activos</p>
                <p className="text-2xl font-bold">{estadisticas.usuarios}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Logins</p>
                <p className="text-2xl font-bold">{estadisticas.acciones.logins}</p>
              </div>
              <LogIn className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={limpiarFiltros}>
                Limpiar
              </Button>
              <Button 
                size="sm" 
                onClick={aplicarFiltros}
                className="text-white"
                style={{ backgroundColor: '#0066cc' }}
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Usuario</Label>
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los usuarios</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Módulo</Label>
              <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los módulos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los módulos</SelectItem>
                  <SelectItem value="usuarios">Usuarios</SelectItem>
                  <SelectItem value="trabajadores">Trabajadores</SelectItem>
                  <SelectItem value="obras">Obras</SelectItem>
                  <SelectItem value="contratos">Contratos</SelectItem>
                  <SelectItem value="documentos">Documentos</SelectItem>
                  <SelectItem value="finanzas">Finanzas</SelectItem>
                  <SelectItem value="configuracion">Configuración</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Acción</Label>
              <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las acciones</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="crear_usuario">Crear Usuario</SelectItem>
                  <SelectItem value="editar_usuario">Editar Usuario</SelectItem>
                  <SelectItem value="crear_trabajador">Crear Trabajador</SelectItem>
                  <SelectItem value="crear_obra">Crear Obra</SelectItem>
                  <SelectItem value="eliminar_documento">Eliminar Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>

            <div>
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>

            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar en logs..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registro de Actividad ({logsFiltrados.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={exportarLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logsFiltrados.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getIconoAccion(log.accion)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{log.trabajadores?.nombre || 'Sistema'}</span>
                        <Badge className={getColorAccion(log.accion)} variant="outline">
                          {log.accion.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getIconoModulo(log.modulo)}
                          {log.modulo}
                        </Badge>
                      </div>
                      {log.detalles && (
                        <p className="text-sm text-gray-600">{log.detalles}</p>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500">
                        {new Date(log.fecha).toLocaleDateString('es-CL')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.fecha).toLocaleTimeString('es-CL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  {log.ip && (
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>IP: {log.ip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {logsFiltrados.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <History className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                <p>No se encontraron registros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Acciones */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Creaciones</p>
                <p className="text-xl font-bold text-blue-600">
                  {estadisticas.acciones.creaciones}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Modificaciones</p>
                <p className="text-xl font-bold text-yellow-600">
                  {estadisticas.acciones.modificaciones}
                </p>
              </div>
              <Activity className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Eliminaciones</p>
                <p className="text-xl font-bold text-red-600">
                  {estadisticas.acciones.eliminaciones}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Accesos</p>
                <p className="text-xl font-bold text-green-600">
                  {estadisticas.acciones.logins}
                </p>
              </div>
              <LogIn className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useState, useEffect } from 'react'
import {
  Building2, Save,
  Shield, AlertCircle, Info,
  Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'

interface ConfiguracionEmpresa {
  id?: number
  nombre: string
  rut: string
  direccion: string
  telefono: string
  email: string
  sitio_web: string
  logo?: string
}

interface ConfiguracionSeguridad {
  id?: number
  intentos_maximos: number
  duracion_sesion: number
  cambio_password_obligatorio: boolean
  password_min_length: number
  password_requiere_numero: boolean
  password_requiere_mayuscula: boolean
  password_requiere_especial: boolean
  bloqueo_automatico: boolean
  notificaciones_email: boolean
}

interface ConfiguracionSistema {
  id?: number
  modo_mantenimiento: boolean
  backup_automatico: boolean
  frecuencia_backup: string
  retencion_logs: number
  notificaciones_internas: boolean
}

export default function TabGeneral() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  
  const [configEmpresa, setConfigEmpresa] = useState<ConfiguracionEmpresa>({
    nombre: 'TECNYCON CONSTRUCTORA',
    rut: '76.XXX.XXX-X',
    direccion: 'Av. Principal 1234, Santiago',
    telefono: '+56 2 2XXX XXXX',
    email: 'contacto@tecnycon.cl',
    sitio_web: 'www.tecnycon.cl'
  })

  const [configSeguridad, setConfigSeguridad] = useState<ConfiguracionSeguridad>({
    intentos_maximos: 5,
    duracion_sesion: 480,
    cambio_password_obligatorio: true,
    password_min_length: 8,
    password_requiere_numero: true,
    password_requiere_mayuscula: true,
    password_requiere_especial: false,
    bloqueo_automatico: true,
    notificaciones_email: true
  })

  const [configSistema, setConfigSistema] = useState<ConfiguracionSistema>({
    modo_mantenimiento: false,
    backup_automatico: true,
    frecuencia_backup: 'diario',
    retencion_logs: 90,
    notificaciones_internas: true
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const { data: empresaData } = await supabase
        .from('configuracion_empresa')
        .select('*')
        .single()

      if (empresaData) {
        setConfigEmpresa(empresaData)
      }

      const { data: seguridadData } = await supabase
        .from('configuracion_seguridad')
        .select('*')
        .single()

      if (seguridadData) {
        setConfigSeguridad(seguridadData)
      }

      const { data: sistemaData } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .single()

      if (sistemaData) {
        setConfigSistema(sistemaData)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarEmpresa = async () => {
    setGuardando(true)
    try {
      if (configEmpresa.id) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('configuracion_empresa')
          .update(configEmpresa)
          .eq('id', configEmpresa.id)

        if (error) throw error
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('configuracion_empresa')
          .insert([configEmpresa])
          .select()
          .single()

        if (error) throw error
        if (data) setConfigEmpresa(data)
      }

      addToast({
        type: 'success',
        title: 'Guardado',
        description: 'Configuración actualizada'
      })
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarSeguridad = async () => {
    setGuardando(true)
    try {
      if (configSeguridad.id) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('configuracion_seguridad')
          .update(configSeguridad)
          .eq('id', configSeguridad.id)

        if (error) throw error
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('configuracion_seguridad')
          .insert([configSeguridad])
          .select()
          .single()

        if (error) throw error
        if (data) setConfigSeguridad(data)
      }

      addToast({
        type: 'success',
        title: 'Guardado',
        description: 'Configuración actualizada'
      })
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarSistema = async () => {
    setGuardando(true)
    try {
      if (configSistema.id) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('configuracion_sistema')
          .update(configSistema)
          .eq('id', configSistema.id)

        if (error) throw error
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('configuracion_sistema')
          .insert([configSistema])
          .select()
          .single()

        if (error) throw error
        if (data) setConfigSistema(data)
      }

      addToast({
        type: 'success',
        title: 'Guardado',
        description: 'Configuración actualizada'
      })
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Información del Sistema</h4>
              <div className="grid gap-2 md:grid-cols-2 text-sm text-blue-800">
                <div>• <strong>Versión:</strong> 1.0.0</div>
                <div>• <strong>Base de Datos:</strong> Supabase</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" style={{ color: '#0066cc' }} />
            Información de la Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={configEmpresa.nombre}
                onChange={(e) => setConfigEmpresa({...configEmpresa, nombre: e.target.value})}
              />
            </div>
            <div>
              <Label>RUT</Label>
              <Input
                value={configEmpresa.rut}
                onChange={(e) => setConfigEmpresa({...configEmpresa, rut: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={configEmpresa.direccion}
                onChange={(e) => setConfigEmpresa({...configEmpresa, direccion: e.target.value})}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={configEmpresa.telefono}
                onChange={(e) => setConfigEmpresa({...configEmpresa, telefono: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={configEmpresa.email}
                onChange={(e) => setConfigEmpresa({...configEmpresa, email: e.target.value})}
              />
            </div>
          </div>
          <Button onClick={handleGuardarEmpresa} disabled={guardando} className="text-white" style={{ backgroundColor: '#0066cc' }}>
            <Save className="h-4 w-4 mr-2" />Guardar
          </Button>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: '#0066cc' }} />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Afecta todas las cuentas</AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Intentos Máximos</Label>
              <Input
                type="number"
                value={configSeguridad.intentos_maximos}
                onChange={(e) => setConfigSeguridad({...configSeguridad, intentos_maximos: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label>Duración Sesión (min)</Label>
              <Input
                type="number"
                value={configSeguridad.duracion_sesion}
                onChange={(e) => setConfigSeguridad({...configSeguridad, duracion_sesion: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Cambio obligatorio primer acceso</Label>
              <Switch
                checked={configSeguridad.cambio_password_obligatorio}
                onCheckedChange={(checked) => setConfigSeguridad({...configSeguridad, cambio_password_obligatorio: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Requiere números</Label>
              <Switch
                checked={configSeguridad.password_requiere_numero}
                onCheckedChange={(checked) => setConfigSeguridad({...configSeguridad, password_requiere_numero: checked})}
              />
            </div>
          </div>

          <Button onClick={handleGuardarSeguridad} disabled={guardando} className="text-white" style={{ backgroundColor: '#0066cc' }}>
            <Save className="h-4 w-4 mr-2" />Guardar
          </Button>
        </CardContent>
      </Card>

      {/* Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" style={{ color: '#0066cc' }} />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label>Modo Mantenimiento</Label>
            <Switch
              checked={configSistema.modo_mantenimiento}
              onCheckedChange={(checked) => setConfigSistema({...configSistema, modo_mantenimiento: checked})}
            />
          </div>
          <Button onClick={handleGuardarSistema} disabled={guardando} className="text-white" style={{ backgroundColor: '#0066cc' }}>
            <Save className="h-4 w-4 mr-2" />Guardar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
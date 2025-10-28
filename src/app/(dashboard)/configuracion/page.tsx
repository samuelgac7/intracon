"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield, History, Settings, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TabUsuarios from '@/components/configuracion/TabUsuarios'
import TabPermisos from '@/components/configuracion/TabPermisos'
import TabAuditoria from '@/components/configuracion/TabAuditoria'
import TabGeneral from '@/components/configuracion/TabGeneral'
import { useAuth } from '@/hooks/useAuth'

export default function ConfiguracionPage() {
  const [tabActivo, setTabActivo] = useState('usuarios')
  const { sesion, isLoading } = useAuth()
  const router = useRouter()

  // Proteger la ruta: solo super-admin puede acceder
  useEffect(() => {
    if (!isLoading && sesion?.rol !== 'super-admin') {
      router.push('/dashboard')
    }
  }, [sesion, isLoading, router])

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si no es super-admin, mostrar mensaje de acceso denegado mientras redirige
  if (sesion?.rol !== 'super-admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
              <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
              <p className="text-sm text-gray-500 mt-2">Redirigiendo al dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Administración y ajustes generales</p>
      </div>

      <Tabs value={tabActivo} onValueChange={setTabActivo}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="permisos" className="data-[state=active]:bg-white">
            <Shield className="h-4 w-4 mr-2" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="data-[state=active]:bg-white">
            <History className="h-4 w-4 mr-2" />
            Auditoría
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-white">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-6">
          <TabUsuarios />
        </TabsContent>

        <TabsContent value="permisos" className="mt-6">
          <TabPermisos />
        </TabsContent>

        <TabsContent value="auditoria" className="mt-6">
          <TabAuditoria />
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <TabGeneral />
        </TabsContent>
      </Tabs>
    </div>
  )
}
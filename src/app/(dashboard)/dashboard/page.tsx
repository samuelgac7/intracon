"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Skeleton } from "@/components/ui/skeleton"
import * as usuariosService from "@/services/usuarios"
import type { Usuario } from "@/lib/supabase"
import DashboardProfesional from "@/components/dashboards/DashboardProfesional"
import DashboardVisitador from "@/components/dashboards/DashboardVisitador"
import DashboardGerencia from "@/components/dashboards/DashboardGerencia"

export default function DashboardPage() {
  const { sesion } = useAuth()
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const cargarUsuario = async () => {
      if (!sesion) {
        setLoading(false)
        return
      }

      try {
        // Obtener datos completos del usuario desde BD
        const usuarioCompleto = await usuariosService.getById(sesion.usuarioId)
        setUsuario(usuarioCompleto)
      } catch (error) {
        console.error('Error cargando usuario:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarUsuario()
  }, [sesion])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Error: No se pudo cargar el usuario</p>
      </div>
    )
  }

  // Renderizar dashboard según el rol del usuario
  switch (usuario.rol) {
    case 'profesional':
      return <DashboardProfesional usuario={usuario} />

    case 'visitador':
      return <DashboardVisitador usuario={usuario} />

    case 'gerente':
    case 'super-admin':
      return <DashboardGerencia usuario={usuario} />

    default:
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Rol no reconocido: {usuario.rol}</p>
        </div>
      )
  }
}
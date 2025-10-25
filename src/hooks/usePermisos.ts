import { useEffect, useState } from 'react'
import { tienePermiso, tienePermisos, tieneAlgunPermiso, obtenerRolDesdeString } from '@/lib/permisos'
import type { Rol, Permiso } from '@/lib/permisos'
import { useAuth } from '@/hooks/useAuth'

export function usePermisos() {
  const { sesion, isLoading: authLoading } = useAuth()
  const [rol, setRol] = useState<Rol | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (sesion?.rol) {
        setRol(obtenerRolDesdeString(sesion.rol as string))
      }
      setLoading(false)
    }
  }, [sesion, authLoading])

  const puede = (permiso: Permiso): boolean => {
    return tienePermiso(rol, permiso)
  }

  const puedeTodos = (permisos: Permiso[]): boolean => {
    return tienePermisos(rol, permisos)
  }

  const puedeAlguno = (permisos: Permiso[]): boolean => {
    return tieneAlgunPermiso(rol, permisos)
  }

  const esRol = (rolBuscado: Rol): boolean => {
    return rol === rolBuscado
  }

  const esAlgunoDeEstosRoles = (roles: Rol[]): boolean => {
    return rol ? roles.includes(rol) : false
  }

  return {
    sesion,
    rol,
    loading,
    puede,
    puedeTodos,
    puedeAlguno,
    esRol,
    esAlgunoDeEstosRoles
  }
}

// Hook simplificado para componentes que solo necesitan saber el rol
export function useRol() {
  const { rol, loading } = usePermisos()
  return { rol, loading }
}
"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as usuariosService from '@/services/usuarios'
import { auditoriaService } from '@/services/auditoria'
import type { Usuario } from '@/lib/supabase'

// Storage personalizado para SSR
const customStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(name)
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(name)
  }
}

interface SesionData {
  usuarioId: number
  username: string
  nombre: string
  rol: Usuario['rol']
  cargo?: string
  foto?: string
  mustChangePassword: boolean
  loginTime: string
}

interface AuthStore {
  sesion: SesionData | null
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean

  // Acciones
  login: (usuario: Usuario) => void
  logout: () => void
  updateMustChangePassword: (value: boolean) => void
  checkAuth: () => Promise<boolean>
  refreshUsuario: () => Promise<void>
}

/**
 * Hook global de autenticación usando Zustand
 * Reemplaza localStorage con un store persistente
 * Gestiona la sesión del usuario de forma centralizada
 */
export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      sesion: null,
      usuario: null,
      isAuthenticated: false,
      isLoading: true,

      login: (usuario: Usuario) => {
        const sesion: SesionData = {
          usuarioId: usuario.id,
          username: usuario.credenciales?.username || '',
          nombre: usuario.nombre,
          rol: usuario.rol,
          cargo: usuario.cargo,
          foto: usuario.foto,
          mustChangePassword: usuario.credenciales?.mustChangePassword || false,
          loginTime: new Date().toISOString()
        }

        set({
          sesion,
          usuario, // Guardar el usuario completo
          isAuthenticated: true,
          isLoading: false
        })

        // Registrar evento de login (no bloqueante)
        auditoriaService.registrarEvento({
          usuarioId: usuario.id,
          accion: 'login',
          modulo: 'auth',
          detalles: `Usuario ${usuario.nombre} (${usuario.rol}) inició sesión`
        }).catch(err => console.error('Error registrando login:', err))
      },

      logout: () => {
        const { sesion } = get()

        // Registrar logout antes de limpiar la sesión
        if (sesion) {
          auditoriaService.registrarEvento({
            usuarioId: sesion.usuarioId,
            accion: 'logout',
            modulo: 'auth',
            detalles: `Usuario ${sesion.nombre} cerró sesión`
          }).catch(err => console.error('Error registrando logout:', err))
        }

        set({
          sesion: null,
          usuario: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      refreshUsuario: async () => {
        const { sesion } = get()
        if (!sesion) return

        try {
          const usuario = await usuariosService.getById(sesion.usuarioId)
          if (usuario) {
            set({ usuario })
          }
        } catch (error) {
          console.error('Error refrescando usuario:', error)
        }
      },

      updateMustChangePassword: (value: boolean) => {
        const { sesion } = get()
        if (sesion) {
          set({
            sesion: {
              ...sesion,
              mustChangePassword: value
            }
          })
        }
      },

      checkAuth: async () => {
        const { sesion } = get()

        if (!sesion) {
          set({ isAuthenticated: false, isLoading: false })
          return false
        }

        try {
          // Verificar que el usuario aún existe y está activo
          const usuario = await usuariosService.getById(sesion.usuarioId)

          if (!usuario || !usuario.activo) {
            set({
              sesion: null,
              usuario: null,
              isAuthenticated: false,
              isLoading: false
            })
            return false
          }

          set({
            usuario, // Actualizar usuario completo
            isAuthenticated: true,
            isLoading: false
          })
          return true
        } catch (error) {
          console.error('Error verificando autenticación:', error)
          set({
            sesion: null,
            usuario: null,
            isAuthenticated: false,
            isLoading: false
          })
          return false
        }
      }
    }),
    {
      name: 'tecnycon-auth-storage',
      storage: createJSONStorage(() => customStorage), // Storage compatible con SSR
      partialize: (state) => ({
        sesion: state.sesion,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated
      }),
      skipHydration: false
    }
  )
)

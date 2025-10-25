import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// ==============================================================================
// SERVICIO DE USUARIOS
// ==============================================================================
// Gestión de personal CON acceso a intranet (profesionales, gerentes, visitadores, super-admin)
// ==============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Obtener todos los usuarios
 */
export async function getAll(): Promise<Usuario[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=*&order=nombre.asc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) throw new Error('Error obteniendo usuarios')
  return await response.json()
}

/**
 * Obtener usuario por ID
 */
export async function getById(id: number): Promise<Usuario | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${id}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) throw new Error('Error obteniendo usuario')
  const data = await response.json()
  return data.length > 0 ? data[0] : null
}

/**
 * Obtener usuario por username (para login)
 */
export async function getByUsername(username: string): Promise<Usuario | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) throw new Error('Error obteniendo usuario')

  const allUsers = await response.json()
  const usuario = allUsers?.find((u: Usuario) => u.credenciales?.username === username)
  return usuario || null
}

/**
 * Obtener usuario por email
 */
export async function getByEmail(email: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) return null
  return data
}

/**
 * Obtener usuarios por rol
 */
export async function getByRol(rol: Usuario['rol']): Promise<Usuario[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?rol=eq.${rol}&select=*&order=nombre.asc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) throw new Error('Error obteniendo usuarios por rol')
  return await response.json()
}

/**
 * Obtener permisos por defecto según rol
 */
export function getPermisosDefectoPorRol(rol: Usuario['rol']): Usuario['permisos'] {
  switch (rol) {
    case 'super-admin':
      return {
        trabajadores: { ver: true, crear: true, editar: true, eliminar: true },
        obras: { ver: true, crear: true, editar: true, eliminar: true },
        documentos: { ver: true, subir: true, eliminar: true },
        reportes: { ver: true, generar: true },
        configuracion: { ver: true, editar: true },
        finanzas: { ver: true, editar: true }
      }
    case 'gerente':
      return {
        trabajadores: { ver: true, crear: true, editar: true, eliminar: true },
        obras: { ver: true, crear: true, editar: true, eliminar: true },
        documentos: { ver: true, subir: true, eliminar: true },
        reportes: { ver: true, generar: true },
        configuracion: { ver: true, editar: false },
        finanzas: { ver: true, editar: true }
      }
    case 'visitador':
      return {
        trabajadores: { ver: true, crear: true, editar: true, eliminar: false },
        obras: { ver: true, crear: true, editar: true, eliminar: false },
        documentos: { ver: true, subir: true, eliminar: false },
        reportes: { ver: true, generar: true },
        configuracion: { ver: false, editar: false },
        finanzas: { ver: false, editar: false }
      }
    case 'profesional':
    default:
      return {
        trabajadores: { ver: true, crear: false, editar: false, eliminar: false },
        obras: { ver: true, crear: false, editar: false, eliminar: false },
        documentos: { ver: true, subir: false, eliminar: false },
        reportes: { ver: true, generar: false },
        configuracion: { ver: false, editar: false },
        finanzas: { ver: false, editar: false }
      }
  }
}

/**
 * Crear nuevo usuario
 */
export async function create(usuario: Omit<Usuario, 'id' | 'fecha_creacion' | 'ultima_actualizacion'>, password: string): Promise<Usuario> {
  // Hash del password
  const passwordHash = await bcrypt.hash(password, 10)

  const nuevoUsuario = {
    ...usuario,
    credenciales: {
      username: usuario.credenciales.username,
      passwordHash,
      mustChangePassword: true,
      intentosFallidos: 0
    }
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert([nuevoUsuario])
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Actualizar usuario
 */
export async function update(id: number, updates: Partial<Usuario>): Promise<Usuario> {
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      ...updates,
      ultima_actualizacion: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Eliminar usuario (soft delete)
 */
export async function remove(id: number): Promise<void> {
  const { error} = await supabase
    .from('usuarios')
    .update({ activo: false })
    .eq('id', id)

  if (error) throw error
}

/**
 * Activar usuario
 */
export async function activate(id: number): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ activo: true })
    .eq('id', id)

  if (error) throw error
}

/**
 * Cambiar password de usuario
 */
export async function changePassword(id: number, newPassword: string, mustChange: boolean = false): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10)

  const usuario = await getById(id)
  if (!usuario) throw new Error('Usuario no encontrado')

  const { error } = await supabase
    .from('usuarios')
    .update({
      credenciales: {
        ...usuario.credenciales,
        passwordHash,
        mustChangePassword: mustChange
      }
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Actualizar último acceso
 */
export async function updateLastAccess(id: number): Promise<void> {
  const usuario = await getById(id)
  if (!usuario) throw new Error('Usuario no encontrado')

  const { error } = await supabase
    .from('usuarios')
    .update({
      credenciales: {
        ...usuario.credenciales,
        ultimoAcceso: new Date().toISOString(),
        intentosFallidos: 0
      }
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Incrementar intentos fallidos de login
 */
export async function incrementFailedAttempts(id: number): Promise<void> {
  const usuario = await getById(id)
  if (!usuario) throw new Error('Usuario no encontrado')

  const intentos = (usuario.credenciales.intentosFallidos || 0) + 1

  const { error } = await supabase
    .from('usuarios')
    .update({
      credenciales: {
        ...usuario.credenciales,
        intentosFallidos: intentos
      },
      // Desactivar usuario si supera los 5 intentos
      activo: intentos >= 5 ? false : usuario.activo
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Reset intentos fallidos
 */
export async function resetFailedAttempts(id: number): Promise<void> {
  const usuario = await getById(id)
  if (!usuario) throw new Error('Usuario no encontrado')

  const { error } = await supabase
    .from('usuarios')
    .update({
      credenciales: {
        ...usuario.credenciales,
        intentosFallidos: 0
      }
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Verificar password
 */
export async function verifyPassword(id: number, password: string): Promise<boolean> {
  const usuario = await getById(id)
  if (!usuario) return false

  return await bcrypt.compare(password, usuario.credenciales.passwordHash)
}

/**
 * Actualizar permisos de usuario
 */
export async function updatePermisos(id: number, permisos: Usuario['permisos']): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ permisos })
    .eq('id', id)

  if (error) throw error
}

/**
 * Cambiar rol de usuario
 */
export async function changeRol(id: number, nuevoRol: Usuario['rol']): Promise<void> {
  // Obtener permisos por defecto para el nuevo rol
  const permisosDefecto = getPermisosDefectoPorRol(nuevoRol)

  const { error } = await supabase
    .from('usuarios')
    .update({
      rol: nuevoRol,
      permisos: permisosDefecto
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Obtener estadísticas de usuarios
 */
export async function getEstadisticas() {
  const usuarios = await getAll()

  return {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length,
    porRol: {
      'super-admin': usuarios.filter(u => u.rol === 'super-admin').length,
      'gerente': usuarios.filter(u => u.rol === 'gerente').length,
      'visitador': usuarios.filter(u => u.rol === 'visitador').length,
      'profesional': usuarios.filter(u => u.rol === 'profesional').length,
    }
  }
}

// ==============================================================================
// HELPERS
// ==============================================================================

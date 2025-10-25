/**
 * Constantes y catálogos para USUARIOS (personal profesional con acceso a intranet)
 */

export const ROLES_USUARIOS = {
  PROFESIONAL: 'profesional',
  VISITADOR: 'visitador',
  GERENTE: 'gerente',
  SUPER_ADMIN: 'super-admin'
} as const

export type RolUsuario = typeof ROLES_USUARIOS[keyof typeof ROLES_USUARIOS]

export const ROLES_LABELS = {
  [ROLES_USUARIOS.PROFESIONAL]: 'Profesional',
  [ROLES_USUARIOS.VISITADOR]: 'Visitador de Obra',
  [ROLES_USUARIOS.GERENTE]: 'Gerente',
  [ROLES_USUARIOS.SUPER_ADMIN]: 'Super Administrador'
}

export const ROLES_DESCRIPCION = {
  [ROLES_USUARIOS.PROFESIONAL]: 'Personal profesional con acceso limitado. Puede ver información y generar reportes.',
  [ROLES_USUARIOS.VISITADOR]: 'Visitador de obra que registra asistencia y avances. Acceso a trabajadores y obras asignadas.',
  [ROLES_USUARIOS.GERENTE]: 'Gerente con acceso completo a finanzas, reportes y gestión de personal.',
  [ROLES_USUARIOS.SUPER_ADMIN]: 'Administrador del sistema con acceso total incluyendo configuración.'
}

// Permisos por defecto según rol
export const PERMISOS_POR_ROL: Record<RolUsuario, Permisos> = {
  [ROLES_USUARIOS.PROFESIONAL]: {
    trabajadores: { ver: true, crear: false, editar: false, eliminar: false },
    obras: { ver: true, crear: false, editar: false, eliminar: false },
    documentos: { ver: true, subir: false, eliminar: false },
    reportes: { ver: true, generar: true },
    configuracion: { ver: false, editar: false },
    finanzas: { ver: false, editar: false }
  },
  [ROLES_USUARIOS.VISITADOR]: {
    trabajadores: { ver: true, crear: true, editar: true, eliminar: false },
    obras: { ver: true, crear: false, editar: true, eliminar: false },
    documentos: { ver: true, subir: true, eliminar: false },
    reportes: { ver: true, generar: true },
    configuracion: { ver: false, editar: false },
    finanzas: { ver: false, editar: false }
  },
  [ROLES_USUARIOS.GERENTE]: {
    trabajadores: { ver: true, crear: true, editar: true, eliminar: true },
    obras: { ver: true, crear: true, editar: true, eliminar: true },
    documentos: { ver: true, subir: true, eliminar: true },
    reportes: { ver: true, generar: true },
    configuracion: { ver: true, editar: false },
    finanzas: { ver: true, editar: true }
  },
  [ROLES_USUARIOS.SUPER_ADMIN]: {
    trabajadores: { ver: true, crear: true, editar: true, eliminar: true },
    obras: { ver: true, crear: true, editar: true, eliminar: true },
    documentos: { ver: true, subir: true, eliminar: true },
    reportes: { ver: true, generar: true },
    configuracion: { ver: true, editar: true },
    finanzas: { ver: true, editar: true }
  }
}

export interface Permisos {
  trabajadores: {
    ver: boolean
    crear: boolean
    editar: boolean
    eliminar: boolean
  }
  obras: {
    ver: boolean
    crear: boolean
    editar: boolean
    eliminar: boolean
  }
  documentos: {
    ver: boolean
    subir: boolean
    eliminar: boolean
  }
  reportes: {
    ver: boolean
    generar: boolean
  }
  configuracion: {
    ver: boolean
    editar: boolean
  }
  finanzas: {
    ver: boolean
    editar: boolean
  }
}

// Función helper para verificar permisos
export function tienePermiso(
  usuario: { permisos: Permisos },
  modulo: keyof Permisos,
  accion: string
): boolean {
  const permisosModulo = usuario.permisos[modulo] as any
  return permisosModulo?.[accion] === true
}

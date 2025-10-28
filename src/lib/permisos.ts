export type Rol = 'profesional' | 'visitador' | 'gerente' | 'super-admin'

export type Permiso =
  // Trabajadores
  | 'trabajadores:read'
  | 'trabajadores:read-all'
  | 'trabajadores:create'
  | 'trabajadores:update'
  | 'trabajadores:delete'
  | 'trabajadores:ver-salarios'
  
  // Obras
  | 'obras:read'
  | 'obras:read-all'
  | 'obras:create'
  | 'obras:update'
  | 'obras:delete'
  | 'obras:cambiar-estado'
  | 'obras:ver-finanzas'
  | 'obras:ver-finanzas-avanzadas'
  
  // Documentos
  | 'documentos:read'
  | 'documentos:upload-seguridad'
  | 'documentos:upload-administrativo'
  | 'documentos:upload-obra'
  | 'documentos:delete'
  | 'documentos:aprobar'
  
  // Asistencia
  | 'asistencia:read'
  | 'asistencia:registrar'
  | 'asistencia:editar'
  
  // Evaluaciones
  | 'evaluaciones:read'
  | 'evaluaciones:create-seguridad'
  | 'evaluaciones:create-desempeno'
  | 'evaluaciones:delete'
  
  // Gastos
  | 'gastos:read'
  | 'gastos:create'
  | 'gastos:update'
  | 'gastos:delete'
  
  // Usuarios
  | 'usuarios:read'
  | 'usuarios:create'
  | 'usuarios:update'
  | 'usuarios:delete'
  | 'usuarios:cambiar-roles'
  | 'usuarios:resetear-password'
  
  // Configuración
  | 'config:read'
  | 'config:update'
  | 'config:sistema'
  
  // Auditoría
  | 'auditoria:read'
  | 'auditoria:export'
  
  // Dashboard
  | 'dashboard:basico'
  | 'dashboard:operativo'
  | 'dashboard:ejecutivo'

// Definición de permisos por rol
export const PERMISOS_POR_ROL: Record<Rol, Permiso[]> = {
  'profesional': [
    // Usuario operativo diario (admin, RRHH, prevención)
    // Trabajadores (CRUD completo)
    'trabajadores:read',
    'trabajadores:read-all',
    'trabajadores:create',
    'trabajadores:update',

    // Obras (gestión completa)
    'obras:read',
    'obras:read-all',
    'obras:create',
    'obras:update',
    'obras:cambiar-estado',

    // Documentos (gestión completa)
    'documentos:read',
    'documentos:upload-seguridad',
    'documentos:upload-administrativo',
    'documentos:upload-obra',
    'documentos:delete',

    // Asistencia (gestión completa)
    'asistencia:read',
    'asistencia:registrar',
    'asistencia:editar',

    // Evaluaciones (gestión)
    'evaluaciones:read',
    'evaluaciones:create-seguridad',
    'evaluaciones:create-desempeno',

    // Gastos (gestión)
    'gastos:read',
    'gastos:create',
    'gastos:update',

    // Dashboard operativo
    'dashboard:operativo'
  ],

  'visitador': [
    // Supervisor con KPIs de obras asignadas
    // Trabajadores (supervisión)
    'trabajadores:read',
    'trabajadores:read-all',
    'trabajadores:update',

    // Obras (supervisión)
    'obras:read',
    'obras:read-all',
    'obras:update',

    // Documentos (revisión y carga)
    'documentos:read',
    'documentos:upload-seguridad',
    'documentos:upload-administrativo',
    'documentos:upload-obra',

    // Asistencia (registro)
    'asistencia:read',
    'asistencia:registrar',
    'asistencia:editar',

    // Evaluaciones (revisión)
    'evaluaciones:read',

    // Gastos (revisión)
    'gastos:read',

    // Dashboard operativo con mejores KPIs
    'dashboard:operativo'
  ],

  'gerente': [
    // Trabajadores (CRUD completo + salarios)
    'trabajadores:read',
    'trabajadores:read-all',
    'trabajadores:create',
    'trabajadores:update',
    'trabajadores:delete',
    'trabajadores:ver-salarios',

    // Obras (CRUD completo + finanzas)
    'obras:read',
    'obras:read-all',
    'obras:create',
    'obras:update',
    'obras:delete',
    'obras:cambiar-estado',
    'obras:ver-finanzas',
    'obras:ver-finanzas-avanzadas',

    // Documentos (todo)
    'documentos:read',
    'documentos:upload-seguridad',
    'documentos:upload-administrativo',
    'documentos:upload-obra',
    'documentos:delete',
    'documentos:aprobar',

    // Asistencia
    'asistencia:read',
    'asistencia:registrar',
    'asistencia:editar',

    // Evaluaciones
    'evaluaciones:read',
    'evaluaciones:create-seguridad',
    'evaluaciones:create-desempeno',
    'evaluaciones:delete',

    // Gastos
    'gastos:read',
    'gastos:create',
    'gastos:update',
    'gastos:delete',

    // Usuarios (crear y editar, no eliminar)
    'usuarios:read',
    'usuarios:create',
    'usuarios:update',
    'usuarios:resetear-password',

    // Configuración (solo lectura)
    'config:read',

    // Auditoría
    'auditoria:read',
    'auditoria:export',

    // Dashboard Ejecutivo
    'dashboard:ejecutivo'
  ],

  'super-admin': [
    // TODOS los permisos sin restricción
    'trabajadores:read',
    'trabajadores:read-all',
    'trabajadores:create',
    'trabajadores:update',
    'trabajadores:delete',
    'trabajadores:ver-salarios',
    
    'documentos:read',
    'documentos:upload-seguridad',
    'documentos:upload-administrativo',
    'documentos:upload-obra',
    'documentos:delete',
    'documentos:aprobar',
    
    'asistencia:read',
    'asistencia:registrar',
    'asistencia:editar',
    
    'evaluaciones:read',
    'evaluaciones:create-seguridad',
    'evaluaciones:create-desempeno',
    'evaluaciones:delete',
    
    'obras:read',
    'obras:read-all',
    'obras:create',
    'obras:update',
    'obras:delete',
    'obras:cambiar-estado',
    'obras:ver-finanzas',
    'obras:ver-finanzas-avanzadas',
    
    'gastos:read',
    'gastos:create',
    'gastos:update',
    'gastos:delete',
    
    'usuarios:read',
    'usuarios:create',
    'usuarios:update',
    'usuarios:delete',
    'usuarios:cambiar-roles',
    'usuarios:resetear-password',
    
    'config:read',
    'config:update',
    'config:sistema',
    
    'auditoria:read',
    'auditoria:export',
    
    'dashboard:ejecutivo'
  ]
}

// Helper para verificar si un rol tiene un permiso
export function tienePermiso(rol: Rol | undefined, permiso: Permiso): boolean {
  if (!rol) return false
  return PERMISOS_POR_ROL[rol]?.includes(permiso) || false
}

// Helper para verificar múltiples permisos (requiere TODOS)
export function tienePermisos(rol: Rol | undefined, permisos: Permiso[]): boolean {
  if (!rol) return false
  return permisos.every(permiso => tienePermiso(rol, permiso))
}

// Helper para verificar al menos uno de varios permisos
export function tieneAlgunPermiso(rol: Rol | undefined, permisos: Permiso[]): boolean {
  if (!rol) return false
  return permisos.some(permiso => tienePermiso(rol, permiso))
}

// Obtener rol desde el objeto Usuario
export function obtenerRolDesdeString(rolString?: string): Rol | undefined {
  const rolesValidos: Rol[] = [
    'profesional',
    'visitador',
    'gerente',
    'super-admin'
  ]

  return rolesValidos.find(r => r === rolString)
}

// Verificar si un usuario puede acceder a una ruta
export function puedeAccederRuta(rol: Rol | undefined, ruta: string): boolean {
  if (!rol) return false
  
  const rutasPublicas = ['/login', '/cambiar-password']
  if (rutasPublicas.includes(ruta)) return true
  
  // Rutas protegidas por rol
  const rutasProtegidas: Record<string, Permiso[]> = {
    '/dashboard': ['dashboard:basico'],
    '/trabajadores': ['trabajadores:read'],
    '/obras': ['obras:read'],
    '/configuracion': ['config:read'],
    '/configuracion/usuarios': ['usuarios:read']
  }
  
  // Si la ruta no está en rutasProtegidas, permitir acceso
  const permisosRequeridos = rutasProtegidas[ruta]
  if (!permisosRequeridos) return true
  
  return tieneAlgunPermiso(rol, permisosRequeridos)
}

// Mapeo de roles antiguos a nuevos (para migración)
export function migrarRolAntiguo(rolAntiguo?: string): Rol {
  const mapeo: Record<string, Rol> = {
    'prevencion-riesgos': 'profesional',
    'administrativo': 'profesional',
    'visitador-obra': 'visitador',
    'administrador': 'gerente',
    'usuario': 'profesional',
    'supervisor': 'visitador',
    'gerente': 'gerente',
    'super-admin': 'super-admin'
  }

  return mapeo[rolAntiguo || ''] || 'profesional'
}

// Obtener nivel jerárquico de un rol (para comparaciones)
export function getNivelRol(rol: Rol): number {
  const niveles: Record<Rol, number> = {
    'profesional': 1,
    'visitador': 2,
    'gerente': 3,
    'super-admin': 4
  }
  return niveles[rol] || 0
}
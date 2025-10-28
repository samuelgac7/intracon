/**
 * Configuración de nombres para breadcrumbs
 */

export const breadcrumbsConfig: Record<string, string> = {
  'dashboard': 'Dashboard',
  'trabajadores': 'Trabajadores',
  'obras': 'Obras',
  'configuracion': 'Configuración',
  'recursos-humanos': 'Recursos Humanos',
  'documentacion': 'Documentación',
  'solicitudes-acceso': 'Solicitudes de Acceso',
  'solicitudes': 'Solicitudes',
  'adquisiciones': 'Adquisiciones',
  'finanzas': 'Finanzas',
  'contabilidad': 'Contabilidad',
  'postventa': 'Post-Venta',
  'cambiar-password': 'Cambiar Contraseña',
}

// Rutas que no deben mostrarse en breadcrumbs
export const rutasExcluidas = [
  '/login',
  '/auth/callback',
  '/'
]

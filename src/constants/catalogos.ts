// CATÁLOGO DE CARGOS PARA TRABAJADORES (Personal de terreno)
export const CARGOS_TRABAJADORES = [
  'Jefe de Obra',
  'Capataz',
  'Carpintero',
  'Ayudante Carpintero',
  'Jornal',
  'Pintor',
  'Bodeguero',
  'Maestro',
  'Trazador',
  'Maestro Terminaciones',
  'Chofer',
  'Enfierrador',
  'Soldador',
  'Estructurero',
  'Gasfiter',
  'Encargado Mantención',
  'Ayudante Trazador',
  'Maestro Eléctrico',
  'Aluminero',
  'Supervisor',
  'Tabiquero',
  'Ayudante Eléctrico',
  'Rigger'
] as const

// CATÁLOGO DE CARGOS PARA USUARIOS (Personal profesional con acceso)
export const CARGOS_USUARIOS = [
  'Ingeniero Constructor',
  'Ingeniero Civil',
  'Arquitecto',
  'Técnico Constructor',
  'Técnico en Prevención de Riesgos',
  'Prevencionista',
  'Jefe de Obra',
  'Jefe de Terreno',
  'Supervisor de Terreno',
  'Inspector Técnico',
  'Administrador de Obras',
  'Gerente General',
  'Gerente de Operaciones',
  'Gerente de Proyectos',
  'Otro'
] as const

// ESPECIALIDADES
export const ESPECIALIDADES = [
  'Obra Gruesa',
  'Terminaciones',
  'Carpintería',
  'Fierrería',
  'Eléctrico',
  'Gasfitería',
  'Climatización',
  'Pintura',
  'Yeso Cartón',
  'Pavimentos',
  'Instalaciones Sanitarias',
  'Seguridad',
  'Topografía',
  'Administración',
  'Construcción',
  'Estructuras',
  'Otro'
] as const

// BANCOS CHILE
export const BANCOS = [
  'Banco de Chile',
  'Banco Estado',
  'Banco Santander',
  'Banco BCI',
  'Banco Scotiabank',
  'Banco Itaú',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco Internacional',
  'BICE',
  'Coopeuch',
  'Otro'
] as const

// AFP CHILE
export const AFPS = [
  'Capital',
  'Cuprum',
  'Habitat',
  'Planvital',
  'Provida',
  'Modelo',
  'Uno'
] as const

// ISAPRES
export const ISAPRES = [
  'Banmédica',
  'Colmena Golden Cross',
  'Consalud',
  'Cruz Blanca',
  'Nueva Masvida',
  'Vida Tres',
  'Esencial'
] as const

// REGIONES CHILE
export const REGIONES = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana',
  'Región del Libertador Bernardo O\'Higgins',
  'Región del Maule',
  'Región de Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén',
  'Región de Magallanes'
] as const

// PERMISOS POR ROL
export const PERMISOS_POR_ROL = {
  usuario: {
    modulos: {
      dashboard: 'lectura' as const,
      trabajadores: 'solo-yo' as const,
      obras: 'solo-asignadas' as const,
      finanzas: 'ninguno' as const,
      configuracion: 'ninguno' as const
    }
  },
  supervisor: {
    modulos: {
      dashboard: 'completo' as const,
      trabajadores: 'lectura-todos' as const,
      obras: 'gestion-asignadas' as const,
      finanzas: 'ninguno' as const,
      configuracion: 'ninguno' as const
    }
  },
  administrador: {
    modulos: {
      dashboard: 'completo' as const,
      trabajadores: 'gestion-completa' as const,
      obras: 'gestion-completa' as const,
      finanzas: 'lectura' as const,
      configuracion: 'basica' as const
    }
  },
  gerente: {
    modulos: {
      dashboard: 'completo' as const,
      trabajadores: 'gestion-completa' as const,
      obras: 'gestion-completa' as const,
      finanzas: 'gestion-completa' as const,
      configuracion: 'avanzada' as const
    }
  },
  'super-admin': {
    modulos: {
      dashboard: 'completo' as const,
      trabajadores: 'gestion-completa' as const,
      obras: 'gestion-completa' as const,
      finanzas: 'gestion-completa' as const,
      configuracion: 'avanzada' as const
    }
  }
} as const


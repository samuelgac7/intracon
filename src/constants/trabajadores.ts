/**
 * Constantes y catálogos para TRABAJADORES (personal de terreno SIN acceso a intranet)
 */

// Cargos de trabajadores de terreno (construcción)
export const CARGOS_TRABAJADORES = [
  // Maestros/Supervisores
  'Maestro de Obra',
  'Maestro Albañil',
  'Maestro Carpintero',
  'Maestro Electricista',
  'Maestro Gasfiter',
  'Maestro Pintor',
  'Supervisor de Obra',

  // Oficiales
  'Oficial Albañil',
  'Oficial Carpintero',
  'Oficial Electricista',
  'Oficial Gasfiter',
  'Oficial Pintor',
  'Oficial de Enfierradura',
  'Oficial Soldador',
  'Estucador',
  'Yesero',
  'Ceramista',
  'Instalador de Drywall',
  'Operador de Maquinaria',

  // Ayudantes
  'Ayudante de Albañil',
  'Ayudante de Carpintero',
  'Ayudante de Electricista',
  'Ayudante General',
  'Ayudante de Enfierradura',

  // Jornales
  'Jornal',
  'Jornal de Aseo',
  'Jornal de Bodega'
] as const

export const ESPECIALIDADES = [
  'Albañilería',
  'Carpintería',
  'Electricidad',
  'Gasfitería',
  'Pintura',
  'Enfierradura',
  'Soldadura',
  'Estuco',
  'Yeso',
  'Cerámica',
  'Drywall',
  'Maquinaria Pesada'
] as const

export const CATEGORIAS = ['A', 'B', 'C', 'D', 'E'] as const

export const TIPOS_CONTRATO = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'plazo-fijo', label: 'Plazo Fijo' },
  { value: 'obra', label: 'Por Obra' },
  { value: 'honorarios', label: 'Honorarios' }
] as const

export const TIPOS_JORNADA = [
  { value: 'completa', label: 'Completa' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'turno', label: 'Por Turno' }
] as const

export const ESTADOS_TRABAJADOR = [
  { value: 'activo', label: 'Activo', color: 'green' },
  { value: 'vacaciones', label: 'Vacaciones', color: 'blue' },
  { value: 'licencia', label: 'Licencia Médica', color: 'yellow' },
  { value: 'retirado', label: 'Retirado', color: 'gray' }
] as const

// Previsión social
export const AFPS = [
  'Capital',
  'Cuprum',
  'Habitat',
  'Planvital',
  'Provida',
  'Modelo',
  'UNO'
] as const

export const ISAPRES = [
  'Banmédica',
  'Colmena',
  'Consalud',
  'Cruz Blanca',
  'Nueva Masvida',
  'Vida Tres'
] as const

// Datos personales
export const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes'
] as const

export const ESTADOS_CIVILES = [
  { value: 'soltero', label: 'Soltero/a' },
  { value: 'casado', label: 'Casado/a' },
  { value: 'viudo', label: 'Viudo/a' },
  { value: 'divorciado', label: 'Divorciado/a' }
] as const

export const NACIONALIDADES = [
  { value: 'chilena', label: 'Chilena' },
  { value: 'extranjera', label: 'Extranjera' }
] as const

// Bancos
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
  'Banco Consorcio'
] as const

export const TIPOS_CUENTA = [
  { value: 'corriente', label: 'Cuenta Corriente' },
  { value: 'vista', label: 'Cuenta Vista' },
  { value: 'rut', label: 'Cuenta RUT' }
] as const

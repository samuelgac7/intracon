// Script para migrar datos de localStorage a Supabase
// Ejecutar: npx tsx src/scripts/migrate-to-supabase.ts

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔍 Verificando credenciales...')
console.log(`URL: ${supabaseUrl ? '✅ Encontrada' : '❌ No encontrada'}`)
console.log(`Key: ${supabaseKey ? '✅ Encontrada' : '❌ No encontrada'}\n`)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase')
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Datos de ejemplo
const trabajadoresEjemplo = [
  {
    nombre: "Admin Sistema",
    rut: "11.111.111-1",
    nivel: "gerencia" as const,
    cargo: "Gerente General",
    especialidad: "Administración",
    categoria: "A" as const,
    departamento: "Administración",
    fecha_ingreso: "2020-01-15",
    salario: "5500000",
    contrato: "indefinido" as const,
    tipo_jornada: "completa" as const,
    afp: "Capital",
    prevision: "isapre" as const,
    isapre: "Banmédica",
    email: "admin@tecnycon.cl",
    telefono: "+56912345678",
    direccion: "Av. Providencia 1234",
    comuna: "Providencia",
    region: "Metropolitana de Santiago",
    contacto_emergencia: "María Admin - +56987654321",
    acceso_intranet: true,
    credenciales: {
      username: "admin",
      passwordHash: btoa("admin123"),
      mustChangePassword: false,
      ultimoAcceso: new Date().toISOString(),
      intentosFallidos: 0
    },
    rol: "super-admin" as const,
    nacionalidad: "chilena" as const,
    estado_civil: "casado" as const,
    hijos: 2,
    cargas: 3,
    nivel_educacional: "universitaria" as const,
    banco: "Banco de Chile",
    tipo_cuenta: "corriente" as const,
    numero_cuenta: "12345678",
    estado: "activo" as const,
    obras_asignadas: [],
    foto: null,
    notas: "Usuario administrador del sistema"
  },
  {
    nombre: "Juan Pérez",
    rut: "22.222.222-2",
    nivel: "profesional" as const,
    cargo: "Ingeniero Civil",
    especialidad: "Estructuras",
    categoria: "B" as const,
    departamento: "Ingeniería",
    fecha_ingreso: "2021-03-10",
    salario: "3200000",
    contrato: "indefinido" as const,
    tipo_jornada: "completa" as const,
    afp: "Habitat",
    prevision: "fonasa" as const,
    email: "jperez@tecnycon.cl",
    telefono: "+56923456789",
    direccion: "Los Leones 890",
    comuna: "Providencia",
    region: "Metropolitana de Santiago",
    contacto_emergencia: "Ana Pérez - +56998765432",
    acceso_intranet: true,
    credenciales: {
      username: "jperez",
      passwordHash: btoa("ingeniero2024"),
      mustChangePassword: false,
      ultimoAcceso: null,
      intentosFallidos: 0
    },
    rol: "supervisor" as const,
    nacionalidad: "chilena" as const,
    estado_civil: "casado" as const,
    hijos: 1,
    cargas: 2,
    nivel_educacional: "universitaria" as const,
    banco: "Banco Santander",
    tipo_cuenta: "vista" as const,
    numero_cuenta: "23456789",
    estado: "activo" as const,
    obras_asignadas: [],
    foto: null,
    notas: "Ingeniero responsable de proyectos"
  },
  {
    nombre: "María González",
    rut: "33.333.333-3",
    nivel: "tecnico" as const,
    cargo: "Técnico en Construcción",
    especialidad: "Topografía",
    categoria: "C" as const,
    departamento: "Terreno",
    fecha_ingreso: "2022-06-01",
    salario: "1800000",
    contrato: "indefinido" as const,
    tipo_jornada: "completa" as const,
    afp: "Provida",
    prevision: "fonasa" as const,
    email: "mgonzalez@tecnycon.cl",
    telefono: "+56934567890",
    direccion: "Gran Avenida 5678",
    comuna: "San Miguel",
    region: "Metropolitana de Santiago",
    contacto_emergencia: "Pedro González - +56987654321",
    acceso_intranet: true,
    credenciales: {
      username: "mgonzalez",
      passwordHash: btoa("tecnico2024"),
      mustChangePassword: true,
      ultimoAcceso: null,
      intentosFallidos: 0
    },
    rol: "usuario" as const,
    nacionalidad: "chilena" as const,
    estado_civil: "soltero" as const,
    hijos: 0,
    cargas: 0,
    nivel_educacional: "tecnica" as const,
    banco: "Banco Estado",
    tipo_cuenta: "rut" as const,
    numero_cuenta: "333333333",
    estado: "activo" as const,
    obras_asignadas: [],
    foto: null,
    notas: "Técnico especialista en topografía"
  },
  {
    nombre: "Carlos Silva",
    rut: "44.444.444-4",
    nivel: "obrero" as const,
    cargo: "Maestro Albañil",
    especialidad: "Albañilería",
    categoria: "D" as const,
    departamento: "Construcción",
    fecha_ingreso: "2023-01-15",
    salario: "950000",
    contrato: "plazo-fijo" as const,
    tipo_jornada: "completa" as const,
    afp: "Modelo",
    prevision: "fonasa" as const,
    email: "csilva@tecnycon.cl",
    telefono: "+56945678901",
    direccion: "Santa Rosa 9876",
    comuna: "La Cisterna",
    region: "Metropolitana de Santiago",
    contacto_emergencia: "Rosa Silva - +56976543210",
    acceso_intranet: false,
    credenciales: null,
    rol: null,
    nacionalidad: "chilena" as const,
    estado_civil: "casado" as const,
    hijos: 3,
    cargas: 4,
    nivel_educacional: "media" as const,
    banco: "Banco Estado",
    tipo_cuenta: "rut" as const,
    numero_cuenta: "444444444",
    estado: "activo" as const,
    obras_asignadas: [],
    foto: null,
    notas: "Maestro albañil con 20 años de experiencia"
  }
]

const obrasEjemplo = [
  {
    nombre: "Edificio Las Condes",
    ubicacion: "Las Condes, Santiago",
    cliente: "Inmobiliaria ABC",
    fecha_inicio: "2024-01-15",
    fecha_termino: "2025-06-30",
    presupuesto: "250000000",
    estado: "en-curso" as const,
    progreso: 45,
    descripcion: "Construcción de edificio residencial de 12 pisos",
    encargado: null,
    foto: null
  },
  {
    nombre: "Casa Familiar Providencia",
    ubicacion: "Providencia, Santiago",
    cliente: "Familia Rodríguez",
    fecha_inicio: "2023-09-01",
    fecha_termino: "2024-03-31",
    presupuesto: "85000000",
    estado: "finalizada" as const,
    progreso: 100,
    descripcion: "Construcción de casa familiar de 250m2",
    encargado: null,
    foto: null
  },
  {
    nombre: "Centro Comercial Mall Plaza",
    ubicacion: "Maipú, Santiago",
    cliente: "Mall Plaza S.A.",
    fecha_inicio: "2024-03-01",
    fecha_termino: "2025-12-31",
    presupuesto: "500000000",
    estado: "en-curso" as const,
    progreso: 30,
    descripcion: "Ampliación de centro comercial - Nueva ala",
    encargado: null,
    foto: null
  }
]

async function migrate() {
  console.log('🚀 Iniciando migración de datos a Supabase...\n')

  try {
    // Verificar conexión
    console.log('🔌 Verificando conexión a Supabase...')
    const { error: testError } = await supabase
      .from('trabajadores')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Error de conexión:', testError.message)
      return
    }
    console.log('✅ Conexión exitosa\n')

    // 1. Limpiar datos existentes (opcional)
    console.log('🧹 Limpiando datos existentes...')
    await supabase.from('trabajadores').delete().neq('id', 0)
    await supabase.from('obras').delete().neq('id', 0)
    console.log('✅ Datos limpiados\n')

    // 2. Migrar Trabajadores
    console.log('📋 Migrando trabajadores...')
    const { data: trabajadoresInsertados, error: errorTrabajadores } = await supabase
      .from('trabajadores')
      .insert(trabajadoresEjemplo)
      .select()

    if (errorTrabajadores) {
      console.error('❌ Error al insertar trabajadores:', errorTrabajadores.message)
      return
    }

    console.log(`✅ ${trabajadoresInsertados.length} trabajadores migrados\n`)

    // 3. Migrar Obras
    console.log('🏗️  Migrando obras...')
    const { data: obrasInsertadas, error: errorObras } = await supabase
      .from('obras')
      .insert(obrasEjemplo)
      .select()

    if (errorObras) {
      console.error('❌ Error al insertar obras:', errorObras.message)
      return
    }

    console.log(`✅ ${obrasInsertadas.length} obras migradas\n`)

    // 4. Resumen
    console.log('🎉 ¡Migración completada exitosamente!\n')
    console.log('📊 Resumen:')
    console.log(`   - Trabajadores: ${trabajadoresInsertados.length}`)
    console.log(`   - Obras: ${obrasInsertadas.length}`)
    console.log('\n👤 Credenciales de acceso:')
    console.log('   ✅ admin / admin123 (Super Admin)')
    console.log('   ✅ jperez / ingeniero2024 (Supervisor)')
    console.log('   ✅ mgonzalez / tecnico2024 (Usuario - debe cambiar contraseña)')
    console.log('   ❌ csilva - SIN acceso (obrero)\n')

  } catch (error: unknown) {
    console.error('❌ Error en migración:', error instanceof Error ? error.message : String(error))
  }
}

migrate()
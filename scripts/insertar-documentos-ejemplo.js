const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function insertarDocumentosEjemplo() {
  console.log('Insertando documentos de ejemplo...')

  // El trabajador Francisco Vargas Soto tiene ID 7
  const trabajadorId = 7

  // Documentos GENERALES del trabajador
  const documentos = [
    {
      trabajador_id: trabajadorId,
      nombre: 'ODI - Orientación de Ingreso',
      tipo: 'odi',
      archivo: 'https://ejemplo.com/docs/odi.pdf',
      tamanio: 245000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Documento de orientación de ingreso'
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Cédula de Identidad',
      tipo: 'cedula_identidad',
      archivo: 'https://ejemplo.com/docs/cedula.pdf',
      tamanio: 180000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Cédula de identidad',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Entrega EPP',
      tipo: 'entrega_epp',
      archivo: 'https://ejemplo.com/docs/epp.pdf',
      tamanio: 120000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Entrega de equipos de protección personal',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Política Acoso Laboral',
      tipo: 'politica_acoso',
      archivo: 'https://ejemplo.com/docs/politica-acoso.pdf',
      tamanio: 95000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Política de prevención de acoso laboral',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Certificado Antecedentes',
      tipo: 'certificado_antecedentes',
      archivo: 'https://ejemplo.com/docs/antecedentes.pdf',
      tamanio: 150000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Certificado de antecedentes',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Contrato Trabajador',
      tipo: 'contrato',
      archivo: 'https://ejemplo.com/docs/contrato.pdf',
      tamanio: 320000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Contrato principal del trabajador',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'ODI Cargo - Ayudante General',
      tipo: 'odi_cargo',
      archivo: 'https://ejemplo.com/docs/odi-cargo.pdf',
      tamanio: 180000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'ODI específico del cargo',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Entrega Reglamento Interno',
      tipo: 'entrega_ri',
      archivo: 'https://ejemplo.com/docs/ri.pdf',
      tamanio: 210000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Entrega de reglamento interno',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Política A&D',
      tipo: 'politica_ad',
      archivo: 'https://ejemplo.com/docs/politica-ad.pdf',
      tamanio: 95000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Política de alcohol y drogas',
    },
    {
      trabajador_id: trabajadorId,
      nombre: 'Política SSO',
      tipo: 'politica_sso',
      archivo: 'https://ejemplo.com/docs/politica-sso.pdf',
      tamanio: 105000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Política de seguridad y salud ocupacional',
    }
  ]

  try {
    // Insertar documentos
    const { data, error } = await supabase
      .from('documentos_trabajador')
      .insert(documentos)
      .select()

    if (error) {
      console.error('Error insertando documentos:', error)
    } else {
      console.log(`✓ ${data.length} documentos insertados exitosamente`)
      console.log('\n✅ Documentos de ejemplo creados')
      console.log(`Total: ${data.length} documentos para trabajador ID ${trabajadorId}`)
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

insertarDocumentosEjemplo()

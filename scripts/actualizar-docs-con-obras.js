const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function actualizarDocumentosConObras() {
  console.log('Actualizando documentos con obra_id...')

  const trabajadorId = 7

  // Primero eliminar documentos existentes
  console.log('Eliminando documentos anteriores...')
  await supabase
    .from('documentos_trabajador')
    .delete()
    .eq('trabajador_id', trabajadorId)

  // DOCUMENTOS DE PREVENCIÓN (sin obra_id - aplican a todas las obras)
  const docsPrevencion = [
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'ODI - Orientación de Ingreso',
      tipo: 'odi',
      archivo: 'https://ejemplo.com/docs/odi.pdf',
      tamanio: 245000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Documento de orientación de ingreso'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Cédula de Identidad',
      tipo: 'cedula_identidad',
      archivo: 'https://ejemplo.com/docs/cedula.pdf',
      tamanio: 180000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Cédula de identidad'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Entrega EPP',
      tipo: 'entrega_epp',
      archivo: 'https://ejemplo.com/docs/epp.pdf',
      tamanio: 120000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Entrega de equipos de protección personal'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Política Acoso Laboral',
      tipo: 'politica_acoso',
      archivo: 'https://ejemplo.com/docs/politica-acoso.pdf',
      tamanio: 95000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Política de prevención de acoso laboral'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Certificado Antecedentes',
      tipo: 'certificado_antecedentes',
      archivo: 'https://ejemplo.com/docs/antecedentes.pdf',
      tamanio: 150000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Certificado de antecedentes'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Entrega Reglamento Interno',
      tipo: 'entrega_ri',
      archivo: 'https://ejemplo.com/docs/ri.pdf',
      tamanio: 210000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Entrega de reglamento interno'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Política A&D',
      tipo: 'politica_ad',
      archivo: 'https://ejemplo.com/docs/politica-ad.pdf',
      tamanio: 95000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Política de alcohol y drogas'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Política SSO',
      tipo: 'politica_sso',
      archivo: 'https://ejemplo.com/docs/politica-sso.pdf',
      tamanio: 105000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Política de seguridad y salud ocupacional'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'Datos Personales',
      tipo: 'datos_personales',
      archivo: 'https://ejemplo.com/docs/datos.pdf',
      tamanio: 85000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'Formulario de datos personales'
    },
    {
      trabajador_id: trabajadorId,
      obra_id: null,
      nombre: 'ODI Cargo',
      tipo: 'odi_cargo',
      archivo: 'https://ejemplo.com/docs/odi-cargo.pdf',
      tamanio: 180000,
      fecha_subida: new Date().toISOString(),
      descripcion: 'ODI específico del cargo'
    }
  ]

  // DOCUMENTOS ADMINISTRATIVOS OBRA 5 (Colegio Nuevo Horizonte)
  // El trabajador empezó aquí, necesita: Contrato
  const docsObra5 = [
    {
      trabajador_id: trabajadorId,
      obra_id: 5,
      nombre: 'Contrato Obra Colegio Nuevo Horizonte',
      tipo: 'contrato',
      archivo: 'https://ejemplo.com/docs/contrato-obra5.pdf',
      tamanio: 320000,
      fecha_subida: '2021-05-31T10:00:00.000Z',
      descripcion: 'Contrato inicial para obra Colegio Nuevo Horizonte'
    }
  ]

  // DOCUMENTOS ADMINISTRATIVOS OBRA 2 (Edificio Las Condes)
  // El trabajador pasó de obra 5 a obra 2, le falta: Anexo de Cambio de Obra
  // Por ahora solo tiene el finiquito de la obra 5 (simulamos que terminó allá)
  const docsObra2 = [
    // Este es el finiquito de cuando salió de la obra 5
    {
      trabajador_id: trabajadorId,
      obra_id: 5,
      nombre: 'Finiquito Obra Colegio Nuevo Horizonte',
      tipo: 'finiquito',
      archivo: 'https://ejemplo.com/docs/finiquito-obra5.pdf',
      tamanio: 280000,
      fecha_subida: '2022-03-15T14:30:00.000Z',
      descripcion: 'Finiquito al terminar en obra Colegio Nuevo Horizonte'
    }
    // FALTA: Contrato nuevo para obra 2 (porque se finiquitó en obra 5)
  ]

  try {
    // Insertar documentos de prevención
    const { data: prevData, error: prevError } = await supabase
      .from('documentos_trabajador')
      .insert(docsPrevencion)
      .select()

    if (prevError) {
      console.error('Error insertando documentos de prevención:', prevError)
    } else {
      console.log(`✓ ${prevData.length} documentos de prevención insertados`)
    }

    // Insertar documentos obra 5
    const { data: obra5Data, error: obra5Error } = await supabase
      .from('documentos_trabajador')
      .insert(docsObra5)
      .select()

    if (obra5Error) {
      console.error('Error insertando documentos obra 5:', obra5Error)
    } else {
      console.log(`✓ ${obra5Data.length} documentos administrativos obra 5 insertados`)
    }

    // Insertar documentos relacionados a obra 2
    const { data: obra2Data, error: obra2Error } = await supabase
      .from('documentos_trabajador')
      .insert(docsObra2)
      .select()

    if (obra2Error) {
      console.error('Error insertando documentos obra 2:', obra2Error)
    } else {
      console.log(`✓ ${obra2Data.length} documentos relacionados a obra 2 insertados`)
    }

    console.log('\n✅ Documentos actualizados correctamente')
    console.log(`Total: ${docsPrevencion.length + docsObra5.length + docsObra2.length} documentos`)
    console.log('\n📋 Resumen:')
    console.log(`- ${docsPrevencion.length} documentos de prevención (completos)`)
    console.log(`- Obra 5: 1 contrato + 1 finiquito`)
    console.log(`- Obra 2: FALTA contrato nuevo (porque se finiquitó en obra 5)`)

  } catch (error) {
    console.error('Error:', error)
  }
}

actualizarDocumentosConObras()

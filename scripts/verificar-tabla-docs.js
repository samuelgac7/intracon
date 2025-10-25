const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verificarTabla() {
  console.log('Verificando estructura de tablas...')

  // Intentar obtener un documento si existe
  const { data, error } = await supabase
    .from('documentos_trabajador')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Estructura de documentos_trabajador:')
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]))
    } else {
      console.log('No hay documentos en la tabla aún')
    }
  }
}

verificarTabla()

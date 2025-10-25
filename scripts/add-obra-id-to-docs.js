const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addObraIdColumn() {
  console.log('Agregando columna obra_id a documentos_trabajador...')

  // Ejecutar SQL para agregar la columna
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Agregar columna obra_id si no existe
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'documentos_trabajador'
          AND column_name = 'obra_id'
        ) THEN
          ALTER TABLE documentos_trabajador
          ADD COLUMN obra_id INTEGER REFERENCES obras(id);

          RAISE NOTICE 'Columna obra_id agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna obra_id ya existe';
        END IF;
      END $$;
    `
  })

  if (error) {
    console.error('Error:', error)
    console.log('\nIntentando método alternativo...')

    // Método alternativo: usar SQL directo
    const { error: altError } = await supabase
      .from('documentos_trabajador')
      .select('obra_id')
      .limit(1)

    if (altError && altError.message.includes('column "obra_id" does not exist')) {
      console.log('❌ La columna obra_id no existe y no se pudo agregar automáticamente')
      console.log('\nPor favor ejecuta manualmente en Supabase SQL Editor:')
      console.log('ALTER TABLE documentos_trabajador ADD COLUMN obra_id INTEGER REFERENCES obras(id);')
    } else {
      console.log('✅ La columna obra_id ya existe o se agregó correctamente')
    }
  } else {
    console.log('✅ Operación completada')
  }
}

addObraIdColumn()

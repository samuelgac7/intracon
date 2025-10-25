#!/usr/bin/env node

/**
 * Script para crear el índice único que previene
 * que un trabajador tenga múltiples obras activas
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta configuración de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Configurando constraint de obra única...\n');

  try {
    // Paso 1: Eliminar constraint antigua si existe
    console.log('1️⃣ Verificando constraints existentes...');

    // Intentar eliminar la constraint antigua
    // Nota: Esto puede fallar si ya no existe, y está bien
    const dropOldConstraint = `
      ALTER TABLE trabajadores_obras
      DROP CONSTRAINT IF EXISTS trabajadores_obras_trabajador_id_obra_id_activo_key CASCADE;
    `;

    console.log('   Ejecutando SQL desde Supabase Dashboard...\n');
    console.log('   📋 Copia y pega este SQL en el SQL Editor de Supabase:\n');
    console.log('   ' + '='.repeat(70));
    console.log(dropOldConstraint);

    // Paso 2: Crear índice único
    const createUniqueIndex = `
-- Eliminar índice si ya existe
DROP INDEX IF EXISTS idx_trabajador_obra_activa_unica;

-- Crear índice único parcial
-- Solo permite UNA asignación activa por trabajador
CREATE UNIQUE INDEX idx_trabajador_obra_activa_unica
ON trabajadores_obras (trabajador_id)
WHERE activo = true;
    `;

    console.log(createUniqueIndex);
    console.log('   ' + '='.repeat(70) + '\n');

    console.log('⚠️  Por limitaciones de seguridad, necesitas ejecutar el SQL manualmente.\n');
    console.log('📝 Pasos:');
    console.log('   1. Ve a https://supabase.com/dashboard');
    console.log('   2. Selecciona tu proyecto');
    console.log('   3. Ve a "SQL Editor"');
    console.log('   4. Copia y pega el SQL de arriba');
    console.log('   5. Haz clic en "Run"\n');

    console.log('✅ Una vez ejecutado, el sistema impedirá que un trabajador');
    console.log('   tenga múltiples obras activas simultáneamente.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * Script para verificar las políticas RLS de trabajadores_obras
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Probando con ANON_KEY (como lo hace el frontend)...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConAnonKey() {
  const trabajadorId = 16;

  try {
    // 1. Ver asignaciones actuales
    console.log('1️⃣ Intentando ver asignaciones con ANON_KEY:');
    const { data: asignaciones, error: selectError } = await supabase
      .from('trabajadores_obras')
      .select('*')
      .eq('trabajador_id', trabajadorId);

    if (selectError) {
      console.error('❌ Error SELECT:', selectError.message);
    } else {
      console.log(`✅ SELECT funciona: ${asignaciones?.length || 0} asignaciones encontradas`);
    }

    // 2. Intentar UPDATE
    console.log('\n2️⃣ Intentando UPDATE con ANON_KEY:');
    const { data: updateData, error: updateError } = await supabase
      .from('trabajadores_obras')
      .update({ activo: false, fecha_retiro: new Date().toISOString() })
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)
      .select();

    if (updateError) {
      console.error('❌ Error UPDATE:', updateError.message);
      console.error('   Código:', updateError.code);
      console.error('   Hint:', updateError.hint);
    } else {
      console.log(`✅ UPDATE funciona: ${updateData?.length || 0} filas actualizadas`);
    }

    // 3. Intentar INSERT
    console.log('\n3️⃣ Intentando INSERT con ANON_KEY:');
    const { data: insertData, error: insertError } = await supabase
      .from('trabajadores_obras')
      .insert([{
        obra_id: 2,
        trabajador_id: trabajadorId,
        cargo_en_obra: 'TEST-ANON',
        activo: true
      }])
      .select();

    if (insertError) {
      console.error('❌ Error INSERT:', insertError.message);
      console.error('   Código:', insertError.code);
      console.error('   Detalles:', insertError.details);
    } else {
      console.log('✅ INSERT funciona');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testConAnonKey();

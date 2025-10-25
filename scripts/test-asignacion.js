#!/usr/bin/env node

/**
 * Script para probar la asignación de trabajadores y diagnosticar el problema
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

async function testAsignacion() {
  console.log('🔍 Probando asignación de trabajador...\n');

  const trabajadorId = 16; // El trabajador del error
  const obraIdNueva = 1; // Una obra cualquiera

  try {
    // 1. Ver estado actual
    console.log('1️⃣ Estado actual de asignaciones:');
    const { data: asignacionesActuales } = await supabase
      .from('trabajadores_obras')
      .select('id, obra_id, trabajador_id, cargo_en_obra, activo, fecha_asignacion')
      .eq('trabajador_id', trabajadorId)
      .order('fecha_asignacion', { ascending: false });

    console.log('Asignaciones del trabajador 16:');
    asignacionesActuales?.forEach(a => {
      console.log(`  - ID: ${a.id}, Obra: ${a.obra_id}, Activo: ${a.activo}, Cargo: ${a.cargo_en_obra}`);
    });
    console.log('');

    // 2. Intentar desactivar asignaciones activas
    console.log('2️⃣ Intentando desactivar asignaciones activas...');
    const { data: updateData, error: deactivateError } = await supabase
      .from('trabajadores_obras')
      .update({
        activo: false,
        fecha_retiro: new Date().toISOString()
      })
      .eq('trabajador_id', trabajadorId)
      .eq('activo', true)
      .select();

    if (deactivateError) {
      console.error('❌ Error al desactivar:', deactivateError);
    } else {
      console.log(`✅ Desactivadas ${updateData?.length || 0} asignaciones`);
      updateData?.forEach(d => {
        console.log(`  - Desactivada asignación ID ${d.id} de obra ${d.obra_id}`);
      });
    }
    console.log('');

    // 3. Verificar estado después del update
    console.log('3️⃣ Estado después de desactivar:');
    const { data: despuesUpdate } = await supabase
      .from('trabajadores_obras')
      .select('id, obra_id, trabajador_id, cargo_en_obra, activo')
      .eq('trabajador_id', trabajadorId);

    despuesUpdate?.forEach(a => {
      console.log(`  - ID: ${a.id}, Obra: ${a.obra_id}, Activo: ${a.activo}`);
    });
    console.log('');

    // 4. Intentar insertar nueva asignación
    console.log('4️⃣ Intentando insertar nueva asignación...');
    const { data: insertData, error: insertError } = await supabase
      .from('trabajadores_obras')
      .insert([{
        obra_id: obraIdNueva,
        trabajador_id: trabajadorId,
        cargo_en_obra: 'TEST',
        activo: true
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error al insertar:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Mensaje:', insertError.message);
      console.error('   Detalles:', insertError.details);
    } else {
      console.log('✅ Asignación creada:', insertData);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testAsignacion();

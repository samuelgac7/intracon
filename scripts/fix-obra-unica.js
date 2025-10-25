#!/usr/bin/env node

/**
 * Script para limpiar duplicados y asegurar que un trabajador
 * solo puede estar asignado a UNA obra a la vez
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
  console.log('🔍 Analizando asignaciones de trabajadores a obras...\n');

  try {
    // 1. Obtener todas las asignaciones activas
    const { data: asignaciones, error: fetchError } = await supabase
      .from('trabajadores_obras')
      .select(`
        id,
        trabajador_id,
        obra_id,
        fecha_asignacion,
        cargo_en_obra,
        trabajadores(rut, nombre),
        obras(nombre)
      `)
      .eq('activo', true)
      .order('trabajador_id')
      .order('fecha_asignacion', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`📊 Total de asignaciones activas: ${asignaciones.length}\n`);

    // 2. Encontrar duplicados
    const trabajadorMap = new Map();
    asignaciones.forEach(asig => {
      if (!trabajadorMap.has(asig.trabajador_id)) {
        trabajadorMap.set(asig.trabajador_id, []);
      }
      trabajadorMap.get(asig.trabajador_id).push(asig);
    });

    const duplicados = Array.from(trabajadorMap.entries())
      .filter(([_, asigs]) => asigs.length > 1);

    if (duplicados.length === 0) {
      console.log('✅ No se encontraron trabajadores con múltiples obras activas');
      console.log('✅ La base de datos ya está limpia\n');
      return;
    }

    console.log(`⚠️  Encontrados ${duplicados.length} trabajadores con múltiples obras activas:\n`);

    // 3. Mostrar duplicados y pedir confirmación
    duplicados.forEach(([trabajadorId, asigs]) => {
      const trabajador = asigs[0].trabajadores;
      console.log(`👤 ${trabajador.nombre} (${trabajador.rut}):`);
      asigs.forEach((asig, idx) => {
        const esMasReciente = idx === 0 ? '✓ MANTENER' : '✗ DESACTIVAR';
        console.log(`   ${esMasReciente} - ${asig.obras.nombre} (${asig.cargo_en_obra}) - Asignado: ${new Date(asig.fecha_asignacion).toLocaleDateString()}`);
      });
      console.log('');
    });

    // 4. Calcular cuántas asignaciones se desactivarán
    const totalADesactivar = duplicados.reduce((sum, [_, asigs]) => sum + (asigs.length - 1), 0);
    console.log(`📋 Se desactivarán ${totalADesactivar} asignaciones (manteniendo la más reciente por trabajador)\n`);

    // 5. Desactivar asignaciones duplicadas
    console.log('🔄 Desactivando asignaciones antiguas...\n');

    let desactivadas = 0;
    for (const [trabajadorId, asigs] of duplicados) {
      // Mantener la primera (más reciente), desactivar el resto
      const asignacionesADesactivar = asigs.slice(1);

      for (const asig of asignacionesADesactivar) {
        const { error: updateError } = await supabase
          .from('trabajadores_obras')
          .update({
            activo: false,
            fecha_retiro: new Date().toISOString()
          })
          .eq('id', asig.id);

        if (updateError) {
          console.error(`❌ Error desactivando asignación ID ${asig.id}:`, updateError.message);
        } else {
          desactivadas++;
          console.log(`  ✓ Desactivada: ${asig.trabajadores.nombre} -> ${asig.obras.nombre}`);
        }
      }
    }

    console.log(`\n✅ Desactivadas ${desactivadas} asignaciones duplicadas\n`);

    // 6. Verificación final
    console.log('🔍 Verificando...\n');

    const { data: verificacion, error: verError } = await supabase
      .from('trabajadores_obras')
      .select('trabajador_id')
      .eq('activo', true);

    if (verError) throw verError;

    const counts = {};
    verificacion.forEach(row => {
      counts[row.trabajador_id] = (counts[row.trabajador_id] || 0) + 1;
    });

    const duplicadosRestantes = Object.values(counts).filter(c => c > 1).length;

    if (duplicadosRestantes > 0) {
      console.error(`❌ ERROR: Todavía hay ${duplicadosRestantes} trabajadores con múltiples obras`);
      process.exit(1);
    }

    console.log('✅ Verificación exitosa: Cada trabajador tiene máximo 1 obra activa');
    console.log(`📊 Asignaciones activas finales: ${verificacion.length}`);
    console.log(`👥 Trabajadores con obra asignada: ${Object.keys(counts).length}\n`);

    console.log('🎉 Limpieza completada exitosamente!\n');

    console.log('⚠️  IMPORTANTE: Ahora necesitas ejecutar la migración SQL para crear el índice único.');
    console.log('   Puedes hacerlo desde el SQL Editor de Supabase con el archivo:');
    console.log('   supabase/migrations/fix-trabajador-obra-unica.sql\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

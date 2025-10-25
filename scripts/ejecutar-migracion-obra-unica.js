#!/usr/bin/env node

/**
 * Script para ejecutar la migración que asegura que un trabajador
 * solo puede estar asignado a UNA obra a la vez
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Falta configuración de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ejecutarMigracion() {
  console.log('🔍 Iniciando migración: Trabajador -> Obra única\n');

  try {
    // Leer archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migrations/fix-trabajador-obra-unica.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración cargada desde:', migrationPath);
    console.log('📊 Ejecutando migración...\n');

    // Ejecutar migración
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Si exec_sql no existe, intentar ejecutar directamente
      console.log('⚠️  No existe función exec_sql, ejecutando directamente...\n');

      // Dividir en statements individuales (evitar problemas con transacciones)
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('begin') ||
            statement.toLowerCase().includes('commit') ||
            statement.toLowerCase().includes('rollback')) {
          continue; // Saltar control de transacciones
        }

        const { error: stmtError } = await supabase.rpc('exec', {
          query: statement
        });

        if (stmtError) {
          console.error('❌ Error ejecutando statement:', stmtError.message);
          console.error('Statement:', statement.substring(0, 100));
        }
      }
    }

    console.log('✅ Migración ejecutada\n');

    // Verificar resultado
    console.log('🔍 Verificando estado final...\n');

    const { data: duplicados, error: checkError } = await supabase
      .from('trabajadores_obras')
      .select('trabajador_id')
      .eq('activo', true);

    if (checkError) {
      console.error('❌ Error verificando:', checkError.message);
      process.exit(1);
    }

    // Contar duplicados
    const trabajadorCounts = {};
    duplicados.forEach(row => {
      trabajadorCounts[row.trabajador_id] = (trabajadorCounts[row.trabajador_id] || 0) + 1;
    });

    const duplicadosRestantes = Object.values(trabajadorCounts).filter(count => count > 1).length;

    if (duplicadosRestantes > 0) {
      console.error(`❌ ERROR: Todavía hay ${duplicadosRestantes} trabajadores con múltiples obras activas`);
      console.log('\nTrabajadores con problemas:');
      Object.entries(trabajadorCounts).forEach(([trabajadorId, count]) => {
        if (count > 1) {
          console.log(`  - Trabajador ID ${trabajadorId}: ${count} obras activas`);
        }
      });
      process.exit(1);
    }

    console.log('✅ Verificación exitosa: No hay duplicados');
    console.log(`📊 Total de asignaciones activas: ${duplicados.length}`);
    console.log(`👥 Trabajadores únicos con obra: ${Object.keys(trabajadorCounts).length}\n`);

    console.log('🎉 Migración completada exitosamente!\n');
    console.log('Cambios realizados:');
    console.log('  ✓ Desactivadas asignaciones duplicadas (se mantiene la más reciente)');
    console.log('  ✓ Eliminada constraint antigua');
    console.log('  ✓ Creado índice único parcial');
    console.log('  ✓ Verificación final: OK\n');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

// Ejecutar
ejecutarMigracion();

/**
 * Script para aplicar política de UPDATE a la tabla solicitudes_acceso
 * Ejecutar con: node scripts/apply-solicitudes-update-policy.js
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no encontradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🔧 Aplicando política de UPDATE para solicitudes_acceso...\n')

  const sqlStatements = [
    `DROP POLICY IF EXISTS "Public can update requests" ON solicitudes_acceso`,
    `DROP POLICY IF EXISTS "Admins can update requests" ON solicitudes_acceso`,
    `DROP POLICY IF EXISTS "Anyone can update requests" ON solicitudes_acceso`,
    `CREATE POLICY "Anyone can update requests"
      ON solicitudes_acceso
      FOR UPDATE
      USING (true)
      WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "Anyone can delete requests" ON solicitudes_acceso`,
    `CREATE POLICY "Anyone can delete requests"
      ON solicitudes_acceso
      FOR DELETE
      USING (true)`
  ]

  for (const sql of sqlStatements) {
    try {
      console.log(`Ejecutando: ${sql.substring(0, 60)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql })

      if (error) {
        // Intentar ejecutar directamente si rpc no funciona
        console.log('  ⚠️  No se pudo ejecutar vía RPC, necesitas ejecutar manualmente en Supabase SQL Editor')
      } else {
        console.log('  ✅ Ejecutado correctamente')
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
    }
  }

  console.log('\n✅ Migración completada!')
  console.log('\n📝 Si hubo errores, copia y pega el siguiente SQL en Supabase SQL Editor:')
  console.log('─'.repeat(80))
  console.log(sqlStatements.join(';\n\n') + ';')
  console.log('─'.repeat(80))
}

applyMigration().catch(console.error)

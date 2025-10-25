const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hbnzsjzrvaxqpmwpjkwk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibnpzanpydmF4cXBtd3Bqa3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NDM0NjUsImV4cCI6MjA1MDIxOTQ2NX0.qTxMJgXg4B55wn-bXFjEKMl6SZNBpU7t7-6hRvyJlns'

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertarContratosPrueba() {
  try {
    console.log('Insertando contratos de prueba...')

    // Calcular fechas
    const hoy = new Date()
    const fecha7Dias = new Date()
    fecha7Dias.setDate(hoy.getDate() + 7)
    const fecha30Dias = new Date()
    fecha30Dias.setDate(hoy.getDate() + 30)

    // Formatear fechas a YYYY-MM-DD
    const formatearFecha = (fecha) => {
      return fecha.toISOString().split('T')[0]
    }

    // Buscar trabajadores existentes
    const { data: trabajadores, error: errorTrabajadores } = await supabase
      .from('trabajadores')
      .select('id, nombre, rut')
      .limit(2)

    if (errorTrabajadores) {
      console.error('Error obteniendo trabajadores:', errorTrabajadores)
      return
    }

    if (trabajadores.length < 2) {
      console.error('No hay suficientes trabajadores en la base de datos')
      return
    }

    // Buscar obras existentes
    const { data: obras, error: errorObras } = await supabase
      .from('obras')
      .select('id, nombre')
      .limit(2)

    if (errorObras) {
      console.error('Error obteniendo obras:', errorObras)
      return
    }

    if (obras.length < 2) {
      console.error('No hay suficientes obras en la base de datos')
      return
    }

    const trabajador1 = trabajadores[0]
    const trabajador2 = trabajadores[1]
    const obra1 = obras[0]
    const obra2 = obras[1]

    console.log(`\nTrabajador 1: ${trabajador1.nombre} (${trabajador1.rut})`)
    console.log(`Trabajador 2: ${trabajador2.nombre} (${trabajador2.rut})`)
    console.log(`Obra 1: ${obra1.nombre}`)
    console.log(`Obra 2: ${obra2.nombre}`)

    // Contrato 1: Vence en 7 días
    const contrato1 = {
      trabajador_id: trabajador1.id,
      obra_id: obra1.id,
      numero_contrato: `CTEST-${Date.now()}-1`,
      es_anexo: false,
      tipo_contrato: 'plazo-fijo',
      fecha_inicio: formatearFecha(new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000)), // Hace 90 días
      fecha_termino: formatearFecha(fecha7Dias),
      ciudad_contrato: 'Santiago',
      cargo: 'Ayudante General',
      salario_base: 500000,
      salario_palabras: 'Quinientos mil pesos',
      suple_quincenal: 50000,
      suple_palabras: 'Cincuenta mil pesos',
      jornada_tipo: 'estandar',
      jornada_detalle: 'Lunes a Viernes 08:00 a 18:00',
      afp: 'Habitat',
      prevision: 'Fonasa',
      estado: 'activo',
      generado_por: 1
    }

    // Contrato 2: Vence en 30 días
    const contrato2 = {
      trabajador_id: trabajador2.id,
      obra_id: obra2.id,
      numero_contrato: `CTEST-${Date.now()}-2`,
      es_anexo: false,
      tipo_contrato: 'plazo-fijo',
      fecha_inicio: formatearFecha(new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000)), // Hace 60 días
      fecha_termino: formatearFecha(fecha30Dias),
      ciudad_contrato: 'Valparaíso',
      cargo: 'Maestro',
      salario_base: 750000,
      salario_palabras: 'Setecientos cincuenta mil pesos',
      suple_quincenal: 75000,
      suple_palabras: 'Setenta y cinco mil pesos',
      jornada_tipo: 'estandar',
      jornada_detalle: 'Lunes a Viernes 08:00 a 18:00',
      afp: 'Capital',
      prevision: 'Fonasa',
      estado: 'activo',
      generado_por: 1
    }

    console.log(`\n📄 Insertando Contrato 1:`)
    console.log(`   - Número: ${contrato1.numero_contrato}`)
    console.log(`   - Trabajador: ${trabajador1.nombre}`)
    console.log(`   - Obra: ${obra1.nombre}`)
    console.log(`   - Fecha inicio: ${contrato1.fecha_inicio}`)
    console.log(`   - Fecha término: ${contrato1.fecha_termino}`)
    console.log(`   - ⚠️  VENCE EN 7 DÍAS`)

    const { data: contratoInsertado1, error: error1 } = await supabase
      .from('contratos')
      .insert([contrato1])
      .select()

    if (error1) {
      console.error('Error insertando contrato 1:', error1)
    } else {
      console.log(`   ✅ Contrato 1 insertado exitosamente (ID: ${contratoInsertado1[0].id})`)
    }

    console.log(`\n📄 Insertando Contrato 2:`)
    console.log(`   - Número: ${contrato2.numero_contrato}`)
    console.log(`   - Trabajador: ${trabajador2.nombre}`)
    console.log(`   - Obra: ${obra2.nombre}`)
    console.log(`   - Fecha inicio: ${contrato2.fecha_inicio}`)
    console.log(`   - Fecha término: ${contrato2.fecha_termino}`)
    console.log(`   - ⏰ VENCE EN 30 DÍAS`)

    const { data: contratoInsertado2, error: error2 } = await supabase
      .from('contratos')
      .insert([contrato2])
      .select()

    if (error2) {
      console.error('Error insertando contrato 2:', error2)
    } else {
      console.log(`   ✅ Contrato 2 insertado exitosamente (ID: ${contratoInsertado2[0].id})`)
    }

    console.log('\n✅ Proceso completado!')
    console.log('\nAhora puedes ver los contratos en el módulo de Gestión Documental.')

  } catch (error) {
    console.error('Error general:', error)
  }
}

insertarContratosPrueba()

-- Script para insertar contratos de prueba que vencen en 7 y 30 días
-- Usar trabajadores y obras existentes

-- Primero, ver qué trabajadores y obras tenemos
DO $$
DECLARE
  trabajador1_id INTEGER;
  trabajador2_id INTEGER;
  trabajador1_nombre VARCHAR;
  trabajador2_nombre VARCHAR;
  obra1_id INTEGER;
  obra2_id INTEGER;
  obra1_nombre VARCHAR;
  obra2_nombre VARCHAR;
  numero_contrato1 VARCHAR;
  numero_contrato2 VARCHAR;
  fecha_inicio1 DATE;
  fecha_inicio2 DATE;
  fecha_termino1 DATE;
  fecha_termino2 DATE;
BEGIN
  -- Obtener trabajadores
  SELECT id, nombre INTO trabajador1_id, trabajador1_nombre
  FROM trabajadores
  ORDER BY id
  LIMIT 1;

  SELECT id, nombre INTO trabajador2_id, trabajador2_nombre
  FROM trabajadores
  WHERE id != trabajador1_id
  ORDER BY id
  LIMIT 1;

  -- Obtener obras
  SELECT id, nombre INTO obra1_id, obra1_nombre
  FROM obras
  ORDER BY id
  LIMIT 1;

  SELECT id, nombre INTO obra2_id, obra2_nombre
  FROM obras
  WHERE id != obra1_id
  ORDER BY id
  LIMIT 1;

  -- Calcular fechas
  fecha_inicio1 := CURRENT_DATE - INTERVAL '90 days';
  fecha_termino1 := CURRENT_DATE + INTERVAL '7 days';

  fecha_inicio2 := CURRENT_DATE - INTERVAL '60 days';
  fecha_termino2 := CURRENT_DATE + INTERVAL '30 days';

  -- Generar números de contrato únicos
  numero_contrato1 := 'CTEST-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-1';
  numero_contrato2 := 'CTEST-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-2';

  -- Insertar Contrato 1: Vence en 7 días
  RAISE NOTICE '';
  RAISE NOTICE '📄 Insertando Contrato 1:';
  RAISE NOTICE '   - Número: %', numero_contrato1;
  RAISE NOTICE '   - Trabajador: %', trabajador1_nombre;
  RAISE NOTICE '   - Obra: %', obra1_nombre;
  RAISE NOTICE '   - Fecha inicio: %', fecha_inicio1;
  RAISE NOTICE '   - Fecha término: %', fecha_termino1;
  RAISE NOTICE '   - ⚠️  VENCE EN 7 DÍAS';

  INSERT INTO contratos (
    trabajador_id,
    obra_id,
    numero_contrato,
    es_anexo,
    tipo_contrato,
    fecha_inicio,
    fecha_termino,
    ciudad_contrato,
    cargo,
    salario_base,
    salario_palabras,
    suple_quincenal,
    suple_palabras,
    jornada_tipo,
    jornada_detalle,
    afp,
    prevision,
    activo,
    generado_por
  ) VALUES (
    trabajador1_id,
    obra1_id,
    numero_contrato1,
    false,
    'plazo-fijo',
    fecha_inicio1,
    fecha_termino1,
    'Santiago',
    'Ayudante General',
    500000,
    'Quinientos mil pesos',
    50000,
    'Cincuenta mil pesos',
    'estandar',
    'Lunes a Viernes 08:00 a 18:00',
    'Habitat',
    'Fonasa',
    true,
    1
  );
  RAISE NOTICE '   ✅ Contrato 1 insertado exitosamente';

  -- Insertar Contrato 2: Vence en 30 días
  RAISE NOTICE '';
  RAISE NOTICE '📄 Insertando Contrato 2:';
  RAISE NOTICE '   - Número: %', numero_contrato2;
  RAISE NOTICE '   - Trabajador: %', trabajador2_nombre;
  RAISE NOTICE '   - Obra: %', obra2_nombre;
  RAISE NOTICE '   - Fecha inicio: %', fecha_inicio2;
  RAISE NOTICE '   - Fecha término: %', fecha_termino2;
  RAISE NOTICE '   - ⏰ VENCE EN 30 DÍAS';

  INSERT INTO contratos (
    trabajador_id,
    obra_id,
    numero_contrato,
    es_anexo,
    tipo_contrato,
    fecha_inicio,
    fecha_termino,
    ciudad_contrato,
    cargo,
    salario_base,
    salario_palabras,
    suple_quincenal,
    suple_palabras,
    jornada_tipo,
    jornada_detalle,
    afp,
    prevision,
    activo,
    generado_por
  ) VALUES (
    trabajador2_id,
    obra2_id,
    numero_contrato2,
    false,
    'plazo-fijo',
    fecha_inicio2,
    fecha_termino2,
    'Valparaíso',
    'Maestro',
    750000,
    'Setecientos cincuenta mil pesos',
    75000,
    'Setenta y cinco mil pesos',
    'estandar',
    'Lunes a Viernes 08:00 a 18:00',
    'Capital',
    'Fonasa',
    true,
    1
  );
  RAISE NOTICE '   ✅ Contrato 2 insertado exitosamente';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Proceso completado!';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora puedes ver los contratos en el módulo de Gestión Documental.';
END $$;

-- ==============================================================================
-- CONFIGURACIÓN DE DOCUMENTOS OBLIGATORIOS
-- ==============================================================================
-- Inserta la configuración de los 14 documentos obligatorios
-- 10 de Prevención + 4 Administrativos
-- ==============================================================================

-- Limpiar configuración existente (si hay)
TRUNCATE TABLE documentos_obligatorios_config RESTART IDENTITY CASCADE;

-- ==============================================================================
-- DOCUMENTOS DE PREVENCIÓN (10)
-- ==============================================================================

INSERT INTO documentos_obligatorios_config
  (nombre, codigo, categoria, descripcion, tiene_vencimiento, requiere_firma, orden_visualizacion)
VALUES
  -- 1. ODI
  ('ODI', 'odi', 'prevencion',
   'Obligación de Informar los riesgos laborales',
   false, true, 1),

  -- 2. ODI Cargo
  ('ODI Cargo', 'odi_cargo', 'prevencion',
   'Obligación de Informar específica del cargo',
   false, true, 2),

  -- 3. Cédula de Identidad
  ('Cédula de Identidad', 'cedula_identidad', 'prevencion',
   'Copia de Cédula de Identidad vigente',
   true, false, 3),

  -- 4. Entrega EPP
  ('Entrega EPP', 'entrega_epp', 'prevencion',
   'Registro de entrega de Elementos de Protección Personal',
   false, true, 4),

  -- 5. Política de Acoso Laboral
  ('Política de Acoso Laboral', 'politica_acoso', 'prevencion',
   'Entrega y firma de Política de Acoso Laboral',
   false, true, 5),

  -- 6. Certificado de Antecedentes
  ('Certificado de Antecedentes', 'certificado_antecedentes', 'prevencion',
   'Certificado de Antecedentes del Registro Civil',
   true, false, 6),

  -- 7. Entrega R.I (Reglamento Interno)
  ('Entrega R.I', 'entrega_ri', 'prevencion',
   'Entrega y firma de Reglamento Interno',
   false, true, 7),

  -- 8. Política A y D
  ('Política A y D', 'politica_ad', 'prevencion',
   'Política de Alcohol y Drogas',
   false, true, 8),

  -- 9. Política de SSO
  ('Política de SSO', 'politica_sso', 'prevencion',
   'Política de Seguridad y Salud Ocupacional',
   false, true, 9),

  -- 10. Datos Personales - Declaración de Enfermedad
  ('Datos Personales - Declaración de Enfermedad', 'datos_personales', 'prevencion',
   'Ficha de datos personales y declaración de enfermedades preexistentes',
   false, true, 10);


-- ==============================================================================
-- DOCUMENTOS ADMINISTRATIVOS (4)
-- ==============================================================================

INSERT INTO documentos_obligatorios_config
  (nombre, codigo, categoria, descripcion, tiene_vencimiento, requiere_firma, orden_visualizacion)
VALUES
  -- 1. Contrato
  ('Contrato', 'contrato', 'administrativo',
   'Contrato de trabajo firmado (OBLIGATORIO para todos)',
   false, true, 11),

  -- 2. Anexo de Plazo
  ('Anexo de Plazo', 'anexo_plazo', 'administrativo',
   'Anexo de plazo cuando vence el contrato original (CONDICIONAL)',
   true, true, 12),

  -- 3. Anexo de Cambio de Obra
  ('Anexo de Cambio de Obra', 'anexo_obra', 'administrativo',
   'Anexo por cambio de obra (CONDICIONAL - solo si ya estaba en otra obra)',
   false, true, 13),

  -- 4. Finiquito
  ('Finiquito', 'finiquito', 'administrativo',
   'Finiquito de contrato o anexo de plazo (CONDICIONAL - al terminar relación laboral)',
   false, true, 14);


-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

DO $$
DECLARE
  total_docs integer;
  docs_prevencion integer;
  docs_admin integer;
BEGIN
  SELECT COUNT(*) INTO total_docs FROM documentos_obligatorios_config;
  SELECT COUNT(*) INTO docs_prevencion FROM documentos_obligatorios_config WHERE categoria = 'prevencion';
  SELECT COUNT(*) INTO docs_admin FROM documentos_obligatorios_config WHERE categoria = 'administrativo';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '     CONFIGURACIÓN DE DOCUMENTOS OBLIGATORIOS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total documentos configurados: %', total_docs;
  RAISE NOTICE '🛡️  Documentos de Prevención: %', docs_prevencion;
  RAISE NOTICE '📋 Documentos Administrativos: %', docs_admin;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

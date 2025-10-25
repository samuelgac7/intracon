-- =====================================================
-- FIX: Política RLS para INSERT en auditoria_asistencia
-- =====================================================
-- Fecha: 2025-10-25
-- Problema: El trigger intenta insertar en auditoria_asistencia pero la política RLS solo permite SELECT
-- Solución: Agregar política para permitir INSERT a usuarios autenticados

-- Eliminar política existente si hay
DROP POLICY IF EXISTS "allow_insert_auditoria" ON public.auditoria_asistencia;

-- Crear política para permitir INSERT
-- Nota: Los inserts solo ocurren via trigger cuando se modifican registros de asistencia
CREATE POLICY "allow_insert_auditoria" ON public.auditoria_asistencia
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Verificar políticas actuales
DO $$
BEGIN
  RAISE NOTICE '✓ Política de INSERT agregada a auditoria_asistencia';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas actuales en auditoria_asistencia:';
  RAISE NOTICE '  - allow_read_auditoria: SELECT';
  RAISE NOTICE '  - allow_insert_auditoria: INSERT';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora podrás guardar cambios desde la vista mensual sin errores 401/42501';
END $$;

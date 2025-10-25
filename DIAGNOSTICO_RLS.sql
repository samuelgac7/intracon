-- =====================================================
-- DIAGNÓSTICO: Políticas RLS en auditoria_asistencia
-- =====================================================

-- Ver todas las políticas actuales en auditoria_asistencia
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'auditoria_asistencia'
ORDER BY policyname;

-- Ver si RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'auditoria_asistencia';

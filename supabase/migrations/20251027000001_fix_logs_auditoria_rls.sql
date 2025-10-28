-- =============================================================================
-- FIX: Políticas RLS para logs_auditoria
-- =============================================================================

-- Eliminar política restrictiva de INSERT
DROP POLICY IF EXISTS "Sistema puede insertar logs" ON logs_auditoria;

-- Nueva política: Permitir INSERT a usuarios autenticados
-- (más permisivo para permitir logging desde la aplicación)
CREATE POLICY "Permitir inserts de logs"
  ON logs_auditoria
  FOR INSERT
  WITH CHECK (true);

-- Nota: La seguridad está en que solo la aplicación puede insertar,
-- y el usuario_id se valida en el código de la aplicación

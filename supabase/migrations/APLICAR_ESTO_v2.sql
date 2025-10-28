-- =============================================================================
-- MIGRACIÓN: Actualizar Tabla logs_auditoria Existente
-- Aplicar este archivo en Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. Agregar columnas faltantes si no existen
ALTER TABLE logs_auditoria ADD COLUMN IF NOT EXISTS detalles TEXT;
ALTER TABLE logs_auditoria ADD COLUMN IF NOT EXISTS ip VARCHAR(45);
ALTER TABLE logs_auditoria ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Asegurar que la columna fecha tenga el DEFAULT correcto
-- (Si la columna ya existe, esto fallará silenciosamente)
DO $$
BEGIN
  -- Intentar alterar el default de fecha
  ALTER TABLE logs_auditoria ALTER COLUMN fecha SET DEFAULT NOW();
EXCEPTION
  WHEN others THEN
    NULL; -- Ignorar si ya está configurado
END $$;

-- 3. Eliminar constraints antiguos si existen
ALTER TABLE logs_auditoria DROP CONSTRAINT IF EXISTS chk_accion;
ALTER TABLE logs_auditoria DROP CONSTRAINT IF EXISTS chk_modulo;

-- 4. Agregar nuevos constraints
ALTER TABLE logs_auditoria ADD CONSTRAINT chk_accion CHECK (accion IN (
  'login', 'logout', 'create', 'update', 'delete',
  'export', 'import', 'view', 'download', 'upload'
));

ALTER TABLE logs_auditoria ADD CONSTRAINT chk_modulo CHECK (modulo IN (
  'trabajadores', 'obras', 'asistencia', 'documentos',
  'contratos', 'liquidaciones', 'usuarios', 'configuracion', 'auth'
));

-- 5. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_auditoria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs_auditoria(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_accion ON logs_auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_fecha ON logs_auditoria(usuario_id, fecha DESC);

-- 6. Habilitar RLS
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 7. Eliminar políticas existentes
DROP POLICY IF EXISTS "Super admins y gerentes pueden ver todos los logs" ON logs_auditoria;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios logs" ON logs_auditoria;
DROP POLICY IF EXISTS "Sistema puede insertar logs" ON logs_auditoria;
DROP POLICY IF EXISTS "Permitir inserts de logs" ON logs_auditoria;
DROP POLICY IF EXISTS "Permitir lectura de logs" ON logs_auditoria;
DROP POLICY IF EXISTS "Denegar actualizaciones de logs" ON logs_auditoria;
DROP POLICY IF EXISTS "Denegar eliminaciones de logs" ON logs_auditoria;

-- 8. Crear políticas de seguridad

-- NOTA: Este sistema usa autenticación personalizada (no auth.uid() de Supabase)
-- Por lo tanto, las políticas son permisivas y la seguridad se maneja en la aplicación

-- Política SELECT: Permitir lectura (la aplicación filtra por rol en TabAuditoria)
CREATE POLICY "Permitir lectura de logs"
  ON logs_auditoria
  FOR SELECT
  USING (true);

-- Política INSERT: Permitir inserts desde la aplicación
CREATE POLICY "Permitir inserts de logs"
  ON logs_auditoria
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE: Denegar actualizaciones (logs son inmutables)
CREATE POLICY "Denegar actualizaciones de logs"
  ON logs_auditoria
  FOR UPDATE
  USING (false);

-- Política DELETE: Denegar eliminaciones (logs son inmutables)
CREATE POLICY "Denegar eliminaciones de logs"
  ON logs_auditoria
  FOR DELETE
  USING (false);

-- 9. Actualizar comentarios
COMMENT ON TABLE logs_auditoria IS 'Registro de auditoría de acciones del sistema';
COMMENT ON COLUMN logs_auditoria.usuario_id IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN logs_auditoria.accion IS 'Tipo de acción realizada (login, create, update, delete, etc.)';
COMMENT ON COLUMN logs_auditoria.modulo IS 'Módulo del sistema donde se realizó la acción';
COMMENT ON COLUMN logs_auditoria.detalles IS 'Detalles adicionales de la acción en formato JSON o texto';
COMMENT ON COLUMN logs_auditoria.ip IS 'Dirección IP del cliente';
COMMENT ON COLUMN logs_auditoria.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN logs_auditoria.fecha IS 'Fecha y hora de la acción';

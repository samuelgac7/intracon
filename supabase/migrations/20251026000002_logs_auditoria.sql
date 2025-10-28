-- =============================================================================
-- TABLA DE LOGS DE AUDITORÍA
-- =============================================================================

-- Tabla principal de logs
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accion VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  detalles TEXT,
  ip VARCHAR(45),
  user_agent TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Índices para búsquedas rápidas
  CONSTRAINT chk_accion CHECK (accion IN (
    'login', 'logout', 'create', 'update', 'delete',
    'export', 'import', 'view', 'download', 'upload'
  )),
  CONSTRAINT chk_modulo CHECK (modulo IN (
    'trabajadores', 'obras', 'asistencia', 'documentos',
    'contratos', 'liquidaciones', 'usuarios', 'configuracion', 'auth'
  ))
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_fecha ON logs_auditoria(fecha DESC);
CREATE INDEX idx_logs_modulo ON logs_auditoria(modulo);
CREATE INDEX idx_logs_accion ON logs_auditoria(accion);
CREATE INDEX idx_logs_usuario_fecha ON logs_auditoria(usuario_id, fecha DESC);

-- Política RLS (Row Level Security)
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Política: Super admins y gerentes pueden ver todos los logs
CREATE POLICY "Super admins y gerentes pueden ver todos los logs"
  ON logs_auditoria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()::integer
      AND usuarios.rol IN ('super-admin', 'gerente')
    )
  );

-- Política: Usuarios pueden ver sus propios logs
CREATE POLICY "Usuarios pueden ver sus propios logs"
  ON logs_auditoria
  FOR SELECT
  USING (usuario_id = auth.uid()::integer);

-- Política: Sistema puede insertar logs (permitir a todos los usuarios autenticados)
CREATE POLICY "Sistema puede insertar logs"
  ON logs_auditoria
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()::integer
    )
  );

-- Comentarios
COMMENT ON TABLE logs_auditoria IS 'Registro de auditoría de acciones del sistema';
COMMENT ON COLUMN logs_auditoria.accion IS 'Tipo de acción realizada (login, create, update, delete, etc.)';
COMMENT ON COLUMN logs_auditoria.modulo IS 'Módulo del sistema donde se realizó la acción';
COMMENT ON COLUMN logs_auditoria.detalles IS 'Detalles adicionales de la acción en formato JSON o texto';
COMMENT ON COLUMN logs_auditoria.ip IS 'Dirección IP del cliente';
COMMENT ON COLUMN logs_auditoria.user_agent IS 'User agent del navegador';

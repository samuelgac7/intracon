-- Migración: Sistema de Notificaciones
-- Fecha: 2025-10-25
-- Descripción: Tabla para gestionar notificaciones del sistema

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  link VARCHAR(500),
  leida BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificaciones_updated_at
  BEFORE UPDATE ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_notificaciones_updated_at();

-- Función para crear notificación
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_usuario_id INTEGER,
  p_tipo VARCHAR(50),
  p_titulo VARCHAR(200),
  p_mensaje TEXT DEFAULT NULL,
  p_link VARCHAR(500) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  v_notificacion_id INTEGER;
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, link, metadata)
  VALUES (p_usuario_id, p_tipo, p_titulo, p_mensaje, p_link, p_metadata)
  RETURNING id INTO v_notificacion_id;

  RETURN v_notificacion_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(p_notificacion_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notificaciones
  SET leida = true
  WHERE id = p_notificacion_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar todas las notificaciones de un usuario como leídas
CREATE OR REPLACE FUNCTION marcar_todas_leidas(p_usuario_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE notificaciones
  SET leida = true
  WHERE usuario_id = p_usuario_id AND leida = false;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar notificaciones antiguas (más de 90 días)
CREATE OR REPLACE FUNCTION limpiar_notificaciones_antiguas()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_rows INTEGER;
BEGIN
  DELETE FROM notificaciones
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
  RETURN v_deleted_rows;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en la tabla
COMMENT ON TABLE notificaciones IS 'Tabla para almacenar notificaciones del sistema para usuarios';
COMMENT ON COLUMN notificaciones.tipo IS 'Tipos: contrato_por_vencer, documento_vencido, solicitud_acceso_pendiente, asistencia_pendiente, trabajador_asignado_obra, sistema';
COMMENT ON COLUMN notificaciones.metadata IS 'Datos adicionales en formato JSON (contrato_id, documento_id, etc)';

-- Migración: Agregar columna obra_id a documentos_trabajador
-- Ejecutar en Supabase SQL Editor

-- Agregar columna obra_id
ALTER TABLE documentos_trabajador
ADD COLUMN IF NOT EXISTS obra_id INTEGER REFERENCES obras(id);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_documentos_trabajador_obra_id
ON documentos_trabajador(obra_id);

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documentos_trabajador'
AND column_name = 'obra_id';

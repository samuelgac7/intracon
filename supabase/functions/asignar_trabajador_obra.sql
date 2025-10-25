-- ==============================================================================
-- FUNCIÓN RPC: asignar_trabajador_a_obra
-- ==============================================================================
-- Asigna un trabajador a una obra de forma atómica
-- Desactiva cualquier asignación previa y crea la nueva
-- Todo en una sola transacción para evitar conflictos
-- Retorna información sobre si hubo cambio de obra (para crear anexo)
-- ==============================================================================

CREATE OR REPLACE FUNCTION asignar_trabajador_a_obra(
  p_trabajador_id bigint,
  p_obra_id bigint,
  p_cargo_en_obra text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_asignacion_id bigint;
  v_obra_anterior_id bigint;
  v_obra_anterior_nombre text;
  v_hubo_cambio boolean := false;
  v_result json;
BEGIN
  -- 1. Verificar si hay una asignación activa anterior
  SELECT obra_id, o.nombre
  INTO v_obra_anterior_id, v_obra_anterior_nombre
  FROM trabajadores_obras to_inner
  JOIN obras o ON o.id = to_inner.obra_id
  WHERE to_inner.trabajador_id = p_trabajador_id
    AND to_inner.activo = true
  LIMIT 1;

  -- Si había obra anterior, marcar que hubo cambio
  IF v_obra_anterior_id IS NOT NULL THEN
    v_hubo_cambio := true;
  END IF;

  -- 2. Desactivar cualquier asignación activa del trabajador
  UPDATE trabajadores_obras
  SET
    activo = false,
    fecha_retiro = NOW()
  WHERE trabajador_id = p_trabajador_id
    AND activo = true;

  -- 3. Crear la nueva asignación
  INSERT INTO trabajadores_obras (
    trabajador_id,
    obra_id,
    cargo_en_obra,
    activo,
    fecha_asignacion
  )
  VALUES (
    p_trabajador_id,
    p_obra_id,
    p_cargo_en_obra,
    true,
    NOW()
  )
  RETURNING id INTO v_asignacion_id;

  -- 4. Construir resultado con información de cambio de obra
  SELECT json_build_object(
    'id', to_result.id,
    'trabajador_id', to_result.trabajador_id,
    'obra_id', to_result.obra_id,
    'cargo_en_obra', to_result.cargo_en_obra,
    'activo', to_result.activo,
    'fecha_asignacion', to_result.fecha_asignacion,
    'fecha_retiro', to_result.fecha_retiro,
    'hubo_cambio_obra', v_hubo_cambio,
    'obra_anterior_id', v_obra_anterior_id,
    'obra_anterior_nombre', v_obra_anterior_nombre
  )
  INTO v_result
  FROM trabajadores_obras to_result
  WHERE to_result.id = v_asignacion_id;

  RETURN v_result;
END;
$$;

-- Dar permisos para que puedan ejecutarla usuarios autenticados
GRANT EXECUTE ON FUNCTION asignar_trabajador_a_obra(bigint, bigint, text) TO anon;
GRANT EXECUTE ON FUNCTION asignar_trabajador_a_obra(bigint, bigint, text) TO authenticated;

-- ==============================================================================
-- COMENTARIO
-- ==============================================================================
COMMENT ON FUNCTION asignar_trabajador_a_obra IS
'Asigna un trabajador a una obra. Desactiva automáticamente cualquier asignación previa del trabajador a otra obra.';

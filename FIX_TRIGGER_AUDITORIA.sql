-- =====================================================
-- FIX: Trigger de auditoría con SECURITY DEFINER
-- =====================================================
-- Fecha: 2025-10-25
-- Problema: El trigger se ejecuta con permisos del usuario autenticado y RLS lo bloquea
-- Solución: Usar SECURITY DEFINER para que el trigger tenga permisos elevados

-- Recrear la función con SECURITY DEFINER
CREATE OR REPLACE FUNCTION trigger_auditoria_asistencia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- ← CLAVE: Ejecutar con permisos del creador, no del usuario
SET search_path = public
AS $$
DECLARE
  usuario_actual bigint;
BEGIN
  -- Intentar obtener usuario actual desde auth.uid()
  BEGIN
    usuario_actual := (SELECT auth.uid()::bigint);
  EXCEPTION WHEN OTHERS THEN
    usuario_actual := NULL;
  END;

  -- Solo auditar en UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Auditar cambio de estado
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
      INSERT INTO public.auditoria_asistencia (
        registro_asistencia_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por
      ) VALUES (
        NEW.id, 'estado', OLD.estado, NEW.estado, usuario_actual
      );
    END IF;

    -- Auditar cambio de horas extras 50%
    IF OLD.horas_extras_50 IS DISTINCT FROM NEW.horas_extras_50 THEN
      INSERT INTO public.auditoria_asistencia (
        registro_asistencia_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por
      ) VALUES (
        NEW.id, 'horas_extras_50', OLD.horas_extras_50::text, NEW.horas_extras_50::text, usuario_actual
      );
    END IF;

    -- Auditar cambio de horas extras 100%
    IF OLD.horas_extras_100 IS DISTINCT FROM NEW.horas_extras_100 THEN
      INSERT INTO public.auditoria_asistencia (
        registro_asistencia_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por
      ) VALUES (
        NEW.id, 'horas_extras_100', OLD.horas_extras_100::text, NEW.horas_extras_100::text, usuario_actual
      );
    END IF;

    -- Auditar cambio de observaciones
    IF OLD.observaciones IS DISTINCT FROM NEW.observaciones THEN
      INSERT INTO public.auditoria_asistencia (
        registro_asistencia_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por
      ) VALUES (
        NEW.id, 'observaciones', OLD.observaciones, NEW.observaciones, usuario_actual
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Verificar que el trigger existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_auditoria_asistencia'
  ) THEN
    RAISE NOTICE '✓ Trigger actualizado exitosamente';
    RAISE NOTICE '';
    RAISE NOTICE 'La función ahora se ejecuta con SECURITY DEFINER';
    RAISE NOTICE 'Esto permite que el trigger inserte en auditoria_asistencia';
    RAISE NOTICE 'sin ser bloqueado por las políticas RLS del usuario';
    RAISE NOTICE '';
    RAISE NOTICE 'Recarga la aplicación y prueba guardar cambios.';
  ELSE
    RAISE WARNING 'El trigger no existe. Ejecuta primero asistencia_mejorada.sql';
  END IF;
END $$;

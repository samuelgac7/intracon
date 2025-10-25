-- =====================================================
-- MEJORAS AL SISTEMA DE ASISTENCIA
-- =====================================================
-- Fecha: 2025-10-24
-- Descripción: Mejoras sustanciales al módulo de asistencia para construcción

-- =====================================================
-- 1. ACTUALIZAR TABLA DE ASISTENCIA
-- =====================================================

-- Agregar nuevos estados
ALTER TABLE public.registros_asistencia
  DROP CONSTRAINT IF EXISTS registros_asistencia_estado_check;

ALTER TABLE public.registros_asistencia
  ADD CONSTRAINT registros_asistencia_estado_check
  CHECK (estado IN (
    'OK',           -- Asistencia normal
    'F',            -- Falta
    'J',            -- Justificativo
    'A',            -- Accidente Laboral
    'L',            -- Licencia
    'BT',           -- Bajada Tomada (descansó)
    'BTR',          -- Bajada Trabajada (trabajó en su día de bajada)
    'R'             -- Renuncia
  ));

-- Agregar campos para horas extras
ALTER TABLE public.registros_asistencia
  ADD COLUMN IF NOT EXISTS horas_extras_50 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_extras_100 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_dia_trabajo boolean DEFAULT true;

-- Renombrar columnas para claridad
ALTER TABLE public.registros_asistencia
  RENAME COLUMN horas_extras TO horas_extras_legacy;

-- Comentarios
COMMENT ON COLUMN public.registros_asistencia.horas_extras_50 IS 'Horas extras al 50% (días normales y sábados)';
COMMENT ON COLUMN public.registros_asistencia.horas_extras_100 IS 'Horas extras al 100% (domingos y festivos)';
COMMENT ON COLUMN public.registros_asistencia.es_dia_trabajo IS 'Si es día laboral o día de bajada';

-- Eliminar tipo_ausencia ya que ahora el estado es más específico
ALTER TABLE public.registros_asistencia
  DROP COLUMN IF EXISTS tipo_ausencia;


-- =====================================================
-- 2. TABLA DE DÍAS FESTIVOS CHILENOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dias_festivos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha date NOT NULL UNIQUE,
  nombre text NOT NULL,
  es_inamovible boolean DEFAULT true, -- No se mueve al lunes
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índice por fecha
CREATE INDEX idx_dias_festivos_fecha ON public.dias_festivos(fecha) WHERE activo = true;

-- Insertar festivos fijos de Chile 2025
INSERT INTO public.dias_festivos (fecha, nombre, es_inamovible) VALUES
  ('2025-01-01', 'Año Nuevo', true),
  ('2025-04-18', 'Viernes Santo', true),
  ('2025-04-19', 'Sábado Santo', true),
  ('2025-05-01', 'Día del Trabajador', true),
  ('2025-05-21', 'Día de las Glorias Navales', true),
  ('2025-06-29', 'San Pedro y San Pablo', false),
  ('2025-07-16', 'Día de la Virgen del Carmen', true),
  ('2025-08-15', 'Asunción de la Virgen', true),
  ('2025-09-18', 'Primera Junta Nacional de Gobierno', true),
  ('2025-09-19', 'Día de las Glorias del Ejército', true),
  ('2025-10-12', 'Encuentro de Dos Mundos', false),
  ('2025-10-31', 'Día de las Iglesias Evangélicas y Protestantes', false),
  ('2025-11-01', 'Día de Todos los Santos', true),
  ('2025-12-08', 'Inmaculada Concepción', true),
  ('2025-12-25', 'Navidad', true)
ON CONFLICT (fecha) DO NOTHING;

COMMENT ON TABLE public.dias_festivos IS 'Días festivos nacionales de Chile para cálculo de horas extras';


-- =====================================================
-- 3. CONFIGURACIÓN DE JORNADA POR OBRA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.configuracion_jornada_obra (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  obra_id bigint NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,

  -- Jornada normal (lunes a viernes)
  horas_jornada_normal numeric NOT NULL DEFAULT 9,
  hora_inicio_normal time DEFAULT '08:00',
  hora_termino_normal time DEFAULT '17:00',

  -- Jornada sábado
  trabaja_sabado boolean DEFAULT true,
  horas_jornada_sabado numeric DEFAULT 5,
  hora_inicio_sabado time DEFAULT '08:00',
  hora_termino_sabado time DEFAULT '13:00',

  -- Sistema de bajadas (descansos rotativos)
  usa_sistema_bajadas boolean DEFAULT false,
  dias_bajada integer DEFAULT 7, -- Cada cuántos días tiene bajada
  duracion_bajada integer DEFAULT 2, -- Cuántos días dura la bajada

  -- Metadata
  activo boolean DEFAULT true,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_fin date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice único parcial para asegurar solo una configuración activa por obra
CREATE UNIQUE INDEX un_config_obra_activa ON public.configuracion_jornada_obra(obra_id) WHERE activo = true;
CREATE INDEX idx_config_jornada_obra ON public.configuracion_jornada_obra(obra_id);

COMMENT ON TABLE public.configuracion_jornada_obra IS 'Configuración de jornada laboral por obra (horas normales, sistema de bajadas, etc)';


-- =====================================================
-- 4. TABLA DE AUDITORÍA DE ASISTENCIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.auditoria_asistencia (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  registro_asistencia_id bigint NOT NULL REFERENCES public.registros_asistencia(id) ON DELETE CASCADE,

  -- Cambio realizado
  campo_modificado text NOT NULL,
  valor_anterior text,
  valor_nuevo text NOT NULL,

  -- Auditoría
  modificado_por bigint REFERENCES public.usuarios(id),
  fecha_modificacion timestamptz DEFAULT now(),
  ip_address inet,

  -- Contexto
  motivo text
);

CREATE INDEX idx_auditoria_asistencia_registro ON public.auditoria_asistencia(registro_asistencia_id);
CREATE INDEX idx_auditoria_asistencia_fecha ON public.auditoria_asistencia(fecha_modificacion DESC);
CREATE INDEX idx_auditoria_asistencia_usuario ON public.auditoria_asistencia(modificado_por);

COMMENT ON TABLE public.auditoria_asistencia IS 'Historial de cambios en registros de asistencia';


-- =====================================================
-- 5. FUNCIONES MEJORADAS
-- =====================================================

-- Función para verificar si una fecha es festivo
CREATE OR REPLACE FUNCTION es_dia_festivo(p_fecha date)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.dias_festivos
    WHERE fecha = p_fecha AND activo = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para obtener tipo de día
CREATE OR REPLACE FUNCTION obtener_tipo_dia(p_fecha date)
RETURNS text AS $$
DECLARE
  dia_semana integer;
BEGIN
  -- 0 = Domingo, 6 = Sábado
  dia_semana := EXTRACT(DOW FROM p_fecha);

  IF es_dia_festivo(p_fecha) THEN
    RETURN 'festivo';
  ELSIF dia_semana = 0 THEN
    RETURN 'domingo';
  ELSIF dia_semana = 6 THEN
    RETURN 'sabado';
  ELSE
    RETURN 'normal';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para calcular horas extras según tipo de día
CREATE OR REPLACE FUNCTION calcular_horas_extras_dia(
  p_horas_trabajadas numeric,
  p_fecha date,
  p_obra_id bigint
)
RETURNS TABLE (he_50 numeric, he_100 numeric) AS $$
DECLARE
  tipo_dia text;
  jornada_normal numeric;
  v_he_50 numeric := 0;
  v_he_100 numeric := 0;
BEGIN
  tipo_dia := obtener_tipo_dia(p_fecha);

  -- Obtener jornada normal de la obra
  SELECT
    CASE
      WHEN tipo_dia = 'sabado' THEN COALESCE(horas_jornada_sabado, 5)
      ELSE COALESCE(horas_jornada_normal, 9)
    END
  INTO jornada_normal
  FROM public.configuracion_jornada_obra
  WHERE obra_id = p_obra_id AND activo = true;

  -- Si no hay configuración, usar valores por defecto
  IF jornada_normal IS NULL THEN
    jornada_normal := CASE WHEN tipo_dia = 'sabado' THEN 5 ELSE 9 END;
  END IF;

  -- Calcular horas extras según tipo de día
  CASE tipo_dia
    WHEN 'domingo', 'festivo' THEN
      -- Domingo/Festivo: Todas las horas son al 100%
      v_he_100 := p_horas_trabajadas;

    WHEN 'sabado' THEN
      -- Sábado: Todas las horas son al 50%
      v_he_50 := p_horas_trabajadas;

    ELSE
      -- Día normal: Solo las horas que exceden la jornada, al 50%
      IF p_horas_trabajadas > jornada_normal THEN
        v_he_50 := p_horas_trabajadas - jornada_normal;
      END IF;
  END CASE;

  RETURN QUERY SELECT v_he_50, v_he_100;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para calcular automáticamente horas extras
CREATE OR REPLACE FUNCTION trigger_calcular_horas_extras_mejorado()
RETURNS trigger AS $$
DECLARE
  horas_totales numeric;
  he_result RECORD;
BEGIN
  -- Solo calcular si hay marcaciones
  IF NEW.hora_entrada IS NOT NULL AND NEW.hora_salida IS NOT NULL THEN
    -- Calcular horas totales trabajadas
    horas_totales := calcular_horas_trabajadas(
      NEW.hora_entrada,
      NEW.hora_salida,
      NEW.hora_entrada_tarde,
      NEW.hora_salida_tarde
    );

    -- Calcular HE según tipo de día
    SELECT * INTO he_result
    FROM calcular_horas_extras_dia(horas_totales, NEW.fecha, NEW.obra_id);

    NEW.horas_trabajadas := horas_totales;
    NEW.horas_extras_50 := he_result.he_50;
    NEW.horas_extras_100 := he_result.he_100;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar trigger anterior
DROP TRIGGER IF EXISTS trigger_calcular_horas_asistencia ON public.registros_asistencia;
CREATE TRIGGER trigger_calcular_horas_asistencia
  BEFORE INSERT OR UPDATE ON public.registros_asistencia
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calcular_horas_extras_mejorado();


-- =====================================================
-- 6. TRIGGER PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_auditoria_asistencia()
RETURNS trigger AS $$
DECLARE
  usuario_actual bigint;
BEGIN
  -- Intentar obtener usuario actual (esto depende de cómo manejes la sesión)
  -- Por ahora, lo dejamos como NULL y se puede pasar manualmente
  usuario_actual := NULL;

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auditoria_asistencia ON public.registros_asistencia;
CREATE TRIGGER trigger_auditoria_asistencia
  AFTER INSERT OR UPDATE ON public.registros_asistencia
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auditoria_asistencia();


-- =====================================================
-- 7. VISTA MEJORADA DE RESUMEN MENSUAL
-- =====================================================

DROP VIEW IF EXISTS resumen_asistencia_mensual CASCADE;

CREATE OR REPLACE VIEW resumen_asistencia_mensual AS
SELECT
  ra.trabajador_id,
  t.nombre as trabajador_nombre,
  t.rut as trabajador_rut,
  t.cargo as trabajador_cargo,
  EXTRACT(YEAR FROM ra.fecha)::integer as anio,
  EXTRACT(MONTH FROM ra.fecha)::integer as mes,

  -- Conteos por estado
  COUNT(*) as dias_registrados,
  COUNT(*) FILTER (WHERE ra.estado = 'OK') as dias_ok,
  COUNT(*) FILTER (WHERE ra.estado = 'F') as dias_falta,
  COUNT(*) FILTER (WHERE ra.estado = 'J') as dias_justificativo,
  COUNT(*) FILTER (WHERE ra.estado = 'A') as dias_accidente,
  COUNT(*) FILTER (WHERE ra.estado = 'L') as dias_licencia,
  COUNT(*) FILTER (WHERE ra.estado = 'BT') as dias_bajada_tomada,
  COUNT(*) FILTER (WHERE ra.estado = 'BTR') as dias_bajada_trabajada,
  COUNT(*) FILTER (WHERE ra.estado = 'R') as dias_renuncia,

  -- Horas
  SUM(ra.horas_trabajadas) as total_horas_trabajadas,
  SUM(ra.horas_extras_50) as total_horas_extras_50,
  SUM(ra.horas_extras_100) as total_horas_extras_100,

  -- Promedios
  AVG(ra.horas_trabajadas) FILTER (WHERE ra.estado = 'OK') as promedio_horas_diarias

FROM public.registros_asistencia ra
JOIN public.trabajadores t ON t.id = ra.trabajador_id
GROUP BY
  ra.trabajador_id,
  t.nombre,
  t.rut,
  t.cargo,
  EXTRACT(YEAR FROM ra.fecha),
  EXTRACT(MONTH FROM ra.fecha);

COMMENT ON VIEW resumen_asistencia_mensual IS 'Resumen mensual mejorado de asistencia con todos los estados y horas extras';


-- =====================================================
-- 8. FUNCIÓN PARA OBTENER ASISTENCIA EN FORMATO EXCEL
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_asistencia_excel(
  p_obra_id bigint,
  p_mes integer,
  p_anio integer
)
RETURNS TABLE (
  trabajador_id bigint,
  nombre text,
  apellidos text,
  rut text,
  cargo text,
  dias jsonb, -- Array de días del mes con sus estados
  total_ok integer,
  total_f integer,
  total_j integer,
  total_a integer,
  total_l integer,
  total_bt integer,
  total_btr integer,
  total_r integer,
  total_he_50 numeric,
  total_he_100 numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH dias_mes AS (
    SELECT generate_series(
      make_date(p_anio, p_mes, 1),
      (make_date(p_anio, p_mes, 1) + interval '1 month - 1 day')::date,
      '1 day'::interval
    )::date as fecha
  ),
  trabajadores_obra AS (
    SELECT DISTINCT t.id, t.nombre, t.rut, t.cargo
    FROM public.trabajadores t
    JOIN public.trabajadores_obras tro ON tro.trabajador_id = t.id
    WHERE tro.obra_id = p_obra_id
      AND tro.activo = true
  ),
  asistencia_completa AS (
    SELECT
      to_obra.id as trabajador_id,
      to_obra.nombre,
      '' as apellidos, -- Separar nombre en apellidos si lo necesitas
      to_obra.rut,
      to_obra.cargo,
      dm.fecha,
      ra.estado,
      ra.horas_extras_50,
      ra.horas_extras_100
    FROM trabajadores_obra to_obra
    CROSS JOIN dias_mes dm
    LEFT JOIN public.registros_asistencia ra ON (
      ra.trabajador_id = to_obra.id AND
      ra.fecha = dm.fecha AND
      ra.obra_id = p_obra_id
    )
  )
  SELECT
    ac.trabajador_id,
    ac.nombre,
    ac.apellidos,
    ac.rut,
    ac.cargo,
    jsonb_agg(
      jsonb_build_object(
        'dia', EXTRACT(DAY FROM ac.fecha),
        'estado', COALESCE(ac.estado, ''),
        'he_50', COALESCE(ac.horas_extras_50, 0),
        'he_100', COALESCE(ac.horas_extras_100, 0)
      ) ORDER BY ac.fecha
    ) as dias,
    COUNT(*) FILTER (WHERE ac.estado = 'OK')::integer as total_ok,
    COUNT(*) FILTER (WHERE ac.estado = 'F')::integer as total_f,
    COUNT(*) FILTER (WHERE ac.estado = 'J')::integer as total_j,
    COUNT(*) FILTER (WHERE ac.estado = 'A')::integer as total_a,
    COUNT(*) FILTER (WHERE ac.estado = 'L')::integer as total_l,
    COUNT(*) FILTER (WHERE ac.estado = 'BT')::integer as total_bt,
    COUNT(*) FILTER (WHERE ac.estado = 'BTR')::integer as total_btr,
    COUNT(*) FILTER (WHERE ac.estado = 'R')::integer as total_r,
    SUM(COALESCE(ac.horas_extras_50, 0)) as total_he_50,
    SUM(COALESCE(ac.horas_extras_100, 0)) as total_he_100
  FROM asistencia_completa ac
  GROUP BY ac.trabajador_id, ac.nombre, ac.apellidos, ac.rut, ac.cargo
  ORDER BY ac.nombre;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_asistencia_excel(bigint, integer, integer) IS 'Obtiene datos de asistencia formateados para exportar a Excel';


-- =====================================================
-- 9. GRANTS Y PERMISOS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.dias_festivos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.configuracion_jornada_obra TO authenticated;
GRANT SELECT ON public.auditoria_asistencia TO authenticated;

GRANT EXECUTE ON FUNCTION es_dia_festivo(date) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_tipo_dia(date) TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_horas_extras_dia(numeric, date, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_asistencia_excel(bigint, integer, integer) TO authenticated;


-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

ALTER TABLE public.dias_festivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_jornada_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_asistencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_festivos" ON public.dias_festivos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_config_jornada" ON public.configuracion_jornada_obra
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_read_auditoria" ON public.auditoria_asistencia
  FOR SELECT TO authenticated USING (true);


-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Tabla de asistencia actualizada con nuevos estados';
  RAISE NOTICE '✓ Tabla de días festivos creada';
  RAISE NOTICE '✓ Configuración de jornada por obra creada';
  RAISE NOTICE '✓ Sistema de auditoría implementado';
  RAISE NOTICE '✓ Funciones de cálculo mejoradas';
  RAISE NOTICE '✓ Vista de resumen mejorada';
  RAISE NOTICE '✓ Función para exportar a Excel creada';
  RAISE NOTICE '';
  RAISE NOTICE 'ASISTENCIA MEJORADA implementada exitosamente!';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Actualizar servicio TypeScript de asistencia';
  RAISE NOTICE '2. Crear componente de marcación masiva';
  RAISE NOTICE '3. Crear servicio de exportación a Excel';
  RAISE NOTICE '4. Crear vista mensual de asistencia';
END $$;

-- =====================================================
-- FASE 1 - MEJORAS CRÍTICAS
-- =====================================================
-- Fecha: 2025-10-24
-- Descripción: Implementación de funcionalidades críticas para operación legal en Chile

-- =====================================================
-- 1. CAMBIAR SALARIO A TIPO NUMERIC
-- =====================================================

-- Migración segura de salario de text a numeric
-- Paso 1: Crear columna temporal
ALTER TABLE public.trabajadores
  ADD COLUMN IF NOT EXISTS salario_numeric numeric;

-- Paso 2: Convertir datos existentes (eliminar puntos y comas)
UPDATE public.trabajadores
  SET salario_numeric =
    CASE
      WHEN salario IS NULL OR TRIM(salario) = '' THEN 0
      WHEN salario ~ '^[0-9]+(\.[0-9]+)?$' THEN salario::numeric
      WHEN salario ~ '^[0-9,\.]+$' THEN
        REPLACE(REPLACE(salario, '.', ''), ',', '')::numeric
      ELSE 0
    END
WHERE salario_numeric IS NULL;

-- Paso 3: Eliminar columna antigua y renombrar
ALTER TABLE public.trabajadores
  DROP COLUMN IF EXISTS salario CASCADE;

ALTER TABLE public.trabajadores
  RENAME COLUMN salario_numeric TO salario;

-- Paso 4: Agregar NOT NULL y constraint (>=0 permite cero temporal)
ALTER TABLE public.trabajadores
  ALTER COLUMN salario SET NOT NULL,
  ALTER COLUMN salario SET DEFAULT 0,
  ADD CONSTRAINT salario_no_negativo CHECK (salario >= 0);

COMMENT ON COLUMN public.trabajadores.salario IS 'Salario base mensual en pesos chilenos (CLP)';


-- =====================================================
-- 2. TABLA DE LIQUIDACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.liquidaciones (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trabajador_id bigint NOT NULL REFERENCES public.trabajadores(id),
  contrato_id bigint NOT NULL REFERENCES public.contratos(id),

  -- Periodo
  periodo_mes integer NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio integer NOT NULL CHECK (periodo_anio >= 2020),

  -- Haberes (ingresos)
  salario_base numeric NOT NULL DEFAULT 0,
  horas_extras numeric DEFAULT 0,
  bono_produccion numeric DEFAULT 0,
  bono_asistencia numeric DEFAULT 0,
  colacion numeric DEFAULT 0,
  movilizacion numeric DEFAULT 0,
  otros_haberes numeric DEFAULT 0,
  otros_haberes_detalle text,
  total_haberes numeric NOT NULL,

  -- Descuentos
  afp_porcentaje numeric DEFAULT 0,
  afp_monto numeric DEFAULT 0,
  salud_porcentaje numeric DEFAULT 0,
  salud_monto numeric DEFAULT 0,
  seguro_cesantia numeric DEFAULT 0,
  impuesto_unico numeric DEFAULT 0,
  anticipos numeric DEFAULT 0,
  prestamos numeric DEFAULT 0,
  otros_descuentos numeric DEFAULT 0,
  otros_descuentos_detalle text,
  total_descuentos numeric NOT NULL,

  -- Líquido a pagar
  liquido_pagar numeric NOT NULL,

  -- Metadata del periodo
  dias_trabajados integer NOT NULL DEFAULT 30,
  dias_licencia integer DEFAULT 0,
  dias_vacaciones integer DEFAULT 0,
  dias_ausencia integer DEFAULT 0,

  -- Estado y control
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN (
    'borrador',
    'calculada',
    'aprobada',
    'pagada',
    'anulada'
  )),

  -- Documentos
  pdf_url text,

  -- Pago
  fecha_pago date,
  metodo_pago text CHECK (metodo_pago IN ('transferencia', 'efectivo', 'cheque')),
  comprobante_pago text,

  -- Auditoría
  generado_por bigint REFERENCES public.usuarios(id),
  aprobado_por bigint REFERENCES public.usuarios(id),
  pagado_por bigint REFERENCES public.usuarios(id),
  fecha_aprobacion timestamptz,
  fecha_generacion timestamptz DEFAULT now(),

  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraint: solo una liquidación por trabajador por periodo
  CONSTRAINT un_liquidacion_periodo UNIQUE (trabajador_id, periodo_mes, periodo_anio)
);

-- Índices para liquidaciones
CREATE INDEX idx_liquidaciones_trabajador ON public.liquidaciones(trabajador_id);
CREATE INDEX idx_liquidaciones_periodo ON public.liquidaciones(periodo_anio DESC, periodo_mes DESC);
CREATE INDEX idx_liquidaciones_estado ON public.liquidaciones(estado);
CREATE INDEX idx_liquidaciones_fecha_pago ON public.liquidaciones(fecha_pago) WHERE fecha_pago IS NOT NULL;

COMMENT ON TABLE public.liquidaciones IS 'Liquidaciones de sueldo mensuales de trabajadores';
COMMENT ON COLUMN public.liquidaciones.total_haberes IS 'Suma de todos los haberes (ingresos)';
COMMENT ON COLUMN public.liquidaciones.total_descuentos IS 'Suma de todos los descuentos';
COMMENT ON COLUMN public.liquidaciones.liquido_pagar IS 'Monto líquido a pagar al trabajador (haberes - descuentos)';


-- =====================================================
-- 3. TABLA DE ASISTENCIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.registros_asistencia (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trabajador_id bigint NOT NULL REFERENCES public.trabajadores(id),
  obra_id bigint NOT NULL REFERENCES public.obras(id),
  fecha date NOT NULL,

  -- Marcaciones
  hora_entrada time,
  hora_salida time,
  hora_entrada_tarde time,  -- Para jornadas con colación
  hora_salida_tarde time,

  -- Cálculos
  horas_trabajadas numeric,
  horas_extras numeric DEFAULT 0,

  -- Estado
  estado text NOT NULL DEFAULT 'presente' CHECK (estado IN (
    'presente',
    'ausente',
    'licencia',
    'vacaciones',
    'permiso',
    'atraso',
    'retiro_anticipado'
  )),

  tipo_ausencia text CHECK (tipo_ausencia IN (
    'licencia_medica',
    'permiso_con_goce',
    'permiso_sin_goce',
    'falta_injustificada',
    'vacaciones_programadas'
  )),

  -- Observaciones
  observaciones text,
  justificacion_archivo text,

  -- Geolocalización (opcional para control de entrada en obra)
  latitud numeric,
  longitud numeric,
  ubicacion_verificada boolean DEFAULT false,

  -- Auditoría
  registrado_por bigint REFERENCES public.usuarios(id),
  aprobado_por bigint REFERENCES public.usuarios(id),
  fecha_aprobacion timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraint: solo un registro por trabajador por día
  CONSTRAINT un_asistencia_trabajador_fecha UNIQUE (trabajador_id, fecha)
);

-- Índices para asistencia
CREATE INDEX idx_asistencia_trabajador ON public.registros_asistencia(trabajador_id);
CREATE INDEX idx_asistencia_fecha ON public.registros_asistencia(fecha DESC);
CREATE INDEX idx_asistencia_obra ON public.registros_asistencia(obra_id, fecha DESC);
CREATE INDEX idx_asistencia_estado ON public.registros_asistencia(estado);
CREATE INDEX idx_asistencia_trabajador_mes ON public.registros_asistencia(
  trabajador_id,
  EXTRACT(YEAR FROM fecha),
  EXTRACT(MONTH FROM fecha)
);

COMMENT ON TABLE public.registros_asistencia IS 'Registro diario de asistencia de trabajadores por obra';
COMMENT ON COLUMN public.registros_asistencia.horas_trabajadas IS 'Horas normales trabajadas en el día';
COMMENT ON COLUMN public.registros_asistencia.horas_extras IS 'Horas extraordinarias trabajadas (sobre jornada normal)';


-- =====================================================
-- 4. VISTA RESUMEN ASISTENCIA MENSUAL
-- =====================================================

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
  COUNT(*) FILTER (WHERE ra.estado = 'presente') as dias_presentes,
  COUNT(*) FILTER (WHERE ra.estado = 'ausente') as dias_ausentes,
  COUNT(*) FILTER (WHERE ra.estado = 'licencia') as dias_licencia,
  COUNT(*) FILTER (WHERE ra.estado = 'vacaciones') as dias_vacaciones,
  COUNT(*) FILTER (WHERE ra.estado = 'atraso') as dias_atraso,
  COUNT(*) FILTER (WHERE ra.estado = 'permiso') as dias_permiso,

  -- Horas
  SUM(ra.horas_trabajadas) as total_horas_trabajadas,
  SUM(ra.horas_extras) as total_horas_extras,

  -- Promedios
  AVG(ra.horas_trabajadas) FILTER (WHERE ra.estado = 'presente') as promedio_horas_diarias

FROM public.registros_asistencia ra
JOIN public.trabajadores t ON t.id = ra.trabajador_id
GROUP BY
  ra.trabajador_id,
  t.nombre,
  t.rut,
  t.cargo,
  EXTRACT(YEAR FROM ra.fecha),
  EXTRACT(MONTH FROM ra.fecha);

COMMENT ON VIEW resumen_asistencia_mensual IS 'Resumen mensual de asistencia por trabajador';


-- =====================================================
-- 5. FUNCIONES PARA LIQUIDACIONES
-- =====================================================

-- Función para calcular AFP según porcentajes 2025
CREATE OR REPLACE FUNCTION calcular_afp(salario_imponible numeric)
RETURNS numeric AS $$
BEGIN
  -- Tope imponible: 81.6 UF (aprox $2,700,000)
  -- Porcentaje AFP promedio: 10%
  RETURN LEAST(salario_imponible * 0.10, 81.6 * 37000 * 0.10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular Salud (Fonasa 7% o Isapre según corresponda)
CREATE OR REPLACE FUNCTION calcular_salud(salario_imponible numeric, porcentaje numeric DEFAULT 7)
RETURNS numeric AS $$
BEGIN
  RETURN salario_imponible * (porcentaje / 100.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular Seguro de Cesantía trabajador (0.6%)
CREATE OR REPLACE FUNCTION calcular_seguro_cesantia_trabajador(salario_imponible numeric)
RETURNS numeric AS $$
BEGIN
  RETURN salario_imponible * 0.006;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular totales de liquidación
CREATE OR REPLACE FUNCTION calcular_totales_liquidacion(liquidacion_id bigint)
RETURNS void AS $$
DECLARE
  haberes numeric;
  descuentos numeric;
BEGIN
  -- Calcular total haberes
  SELECT
    salario_base +
    COALESCE(horas_extras, 0) +
    COALESCE(bono_produccion, 0) +
    COALESCE(bono_asistencia, 0) +
    COALESCE(colacion, 0) +
    COALESCE(movilizacion, 0) +
    COALESCE(otros_haberes, 0)
  INTO haberes
  FROM public.liquidaciones
  WHERE id = liquidacion_id;

  -- Calcular total descuentos
  SELECT
    COALESCE(afp_monto, 0) +
    COALESCE(salud_monto, 0) +
    COALESCE(seguro_cesantia, 0) +
    COALESCE(impuesto_unico, 0) +
    COALESCE(anticipos, 0) +
    COALESCE(prestamos, 0) +
    COALESCE(otros_descuentos, 0)
  INTO descuentos
  FROM public.liquidaciones
  WHERE id = liquidacion_id;

  -- Actualizar totales
  UPDATE public.liquidaciones
  SET
    total_haberes = haberes,
    total_descuentos = descuentos,
    liquido_pagar = haberes - descuentos,
    updated_at = now()
  WHERE id = liquidacion_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_afp(numeric) IS 'Calcula descuento AFP según normativa chilena 2025';
COMMENT ON FUNCTION calcular_salud(numeric, numeric) IS 'Calcula descuento de salud (Fonasa 7% o Isapre variable)';
COMMENT ON FUNCTION calcular_seguro_cesantia_trabajador(numeric) IS 'Calcula seguro de cesantía del trabajador (0.6%)';
COMMENT ON FUNCTION calcular_totales_liquidacion(bigint) IS 'Recalcula totales de una liquidación';


-- =====================================================
-- 6. FUNCIONES PARA ASISTENCIA
-- =====================================================

-- Función para calcular horas trabajadas
CREATE OR REPLACE FUNCTION calcular_horas_trabajadas(
  p_hora_entrada time,
  p_hora_salida time,
  p_hora_entrada_tarde time DEFAULT NULL,
  p_hora_salida_tarde time DEFAULT NULL
)
RETURNS numeric AS $$
DECLARE
  horas_manana numeric := 0;
  horas_tarde numeric := 0;
BEGIN
  -- Calcular horas de la mañana
  IF p_hora_entrada IS NOT NULL AND p_hora_salida IS NOT NULL THEN
    horas_manana := EXTRACT(EPOCH FROM (p_hora_salida - p_hora_entrada)) / 3600.0;
  END IF;

  -- Calcular horas de la tarde
  IF p_hora_entrada_tarde IS NOT NULL AND p_hora_salida_tarde IS NOT NULL THEN
    horas_tarde := EXTRACT(EPOCH FROM (p_hora_salida_tarde - p_hora_entrada_tarde)) / 3600.0;
  END IF;

  RETURN horas_manana + horas_tarde;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para calcular automáticamente horas trabajadas
CREATE OR REPLACE FUNCTION trigger_calcular_horas()
RETURNS trigger AS $$
BEGIN
  NEW.horas_trabajadas := calcular_horas_trabajadas(
    NEW.hora_entrada,
    NEW.hora_salida,
    NEW.hora_entrada_tarde,
    NEW.hora_salida_tarde
  );

  -- Calcular horas extras (más de 8 horas diarias)
  IF NEW.horas_trabajadas > 8 THEN
    NEW.horas_extras := NEW.horas_trabajadas - 8;
    NEW.horas_trabajadas := 8;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_horas_asistencia ON public.registros_asistencia;
CREATE TRIGGER trigger_calcular_horas_asistencia
  BEFORE INSERT OR UPDATE ON public.registros_asistencia
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calcular_horas();

COMMENT ON FUNCTION calcular_horas_trabajadas(time, time, time, time) IS 'Calcula total de horas trabajadas en un día';


-- =====================================================
-- 7. TABLA DE CONTACTOS DE EMERGENCIA (si falta)
-- =====================================================

-- Ya fue creada en quick_wins, pero agregamos constraint adicional
ALTER TABLE public.contactos_emergencia
  ADD CONSTRAINT telefono_principal_valido
  CHECK (LENGTH(telefono_principal) >= 8);


-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para liquidaciones
DROP TRIGGER IF EXISTS trigger_liquidaciones_updated_at ON public.liquidaciones;
CREATE TRIGGER trigger_liquidaciones_updated_at
  BEFORE UPDATE ON public.liquidaciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para asistencia
DROP TRIGGER IF EXISTS trigger_asistencia_updated_at ON public.registros_asistencia;
CREATE TRIGGER trigger_asistencia_updated_at
  BEFORE UPDATE ON public.registros_asistencia
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();


-- =====================================================
-- 9. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_asistencia ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según necesidades)
CREATE POLICY "allow_all_liquidaciones" ON public.liquidaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_asistencia" ON public.registros_asistencia
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_anon_liquidaciones" ON public.liquidaciones
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "allow_anon_asistencia" ON public.registros_asistencia
  FOR ALL TO anon USING (true) WITH CHECK (true);


-- =====================================================
-- 10. GRANTS Y PERMISOS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.liquidaciones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.registros_asistencia TO authenticated;
GRANT SELECT ON resumen_asistencia_mensual TO authenticated;

GRANT EXECUTE ON FUNCTION calcular_afp(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_salud(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_seguro_cesantia_trabajador(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_totales_liquidacion(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_horas_trabajadas(time, time, time, time) TO authenticated;


-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Salario convertido a numeric';
  RAISE NOTICE '✓ Tabla de liquidaciones creada';
  RAISE NOTICE '✓ Tabla de asistencia creada';
  RAISE NOTICE '✓ Funciones de cálculo implementadas';
  RAISE NOTICE '✓ Triggers automáticos configurados';
  RAISE NOTICE '';
  RAISE NOTICE 'FASE 1 - MEJORAS CRÍTICAS implementadas exitosamente!';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Crear servicios TypeScript para liquidaciones';
  RAISE NOTICE '2. Crear servicios TypeScript para asistencia';
  RAISE NOTICE '3. Crear componentes frontend para gestión';
END $$;

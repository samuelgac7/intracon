-- =====================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- =====================================================

-- 1. Crear tabla de bonos mensuales
CREATE TABLE IF NOT EXISTS public.bonos_mensuales (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trabajador_id bigint NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  obra_id bigint NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio integer NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
  monto numeric NOT NULL DEFAULT 0 CHECK (monto >= 0),
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT un_bono_trabajador_mes UNIQUE (trabajador_id, obra_id, mes, anio)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_bonos_obra_mes ON public.bonos_mensuales(obra_id, mes, anio);
CREATE INDEX IF NOT EXISTS idx_bonos_trabajador ON public.bonos_mensuales(trabajador_id);

-- 3. RLS
ALTER TABLE public.bonos_mensuales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar bonos" ON public.bonos_mensuales;
CREATE POLICY "Usuarios autenticados pueden gestionar bonos"
  ON public.bonos_mensuales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Trigger
CREATE OR REPLACE FUNCTION public.actualizar_updated_at_bonos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_updated_at_bonos ON public.bonos_mensuales;
CREATE TRIGGER trigger_actualizar_updated_at_bonos
  BEFORE UPDATE ON public.bonos_mensuales
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at_bonos();

-- ✅ LISTO! Ahora deberías poder usar la vista mensual

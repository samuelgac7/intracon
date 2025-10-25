-- ============================================
-- SCRIPT DE LIMPIEZA COMPLETA Y AGRESIVA
-- ============================================
-- Este script elimina TODAS las tablas, políticas RLS y datos
-- de la base de datos para empezar desde cero.
--
-- ⚠️ ADVERTENCIA: Este script es DESTRUCTIVO
-- ⚠️ Ejecutar solo si estás seguro de eliminar todo
-- ============================================

-- Paso 1: Desactivar RLS en TODAS las tablas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Paso 2: Eliminar TODAS las políticas RLS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Paso 3: Eliminar TODAS las tablas del esquema public
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Primero eliminar todas las foreign keys
    FOR r IN (
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    )
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    -- Luego eliminar todas las tablas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Paso 4: Eliminar todas las secuencias (sequences)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    )
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;

-- Paso 5: Eliminar todas las funciones personalizadas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc
        INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE pg_namespace.nspname = 'public'
        AND proname NOT LIKE 'pg_%'
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- Paso 6: Eliminar todos los tipos personalizados (enums, etc)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT typname
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
        AND typtype = 'e'  -- enums
    )
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Verificar que todo fue eliminado
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    sequence_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO sequence_count FROM information_schema.sequences WHERE sequence_schema = 'public';

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ LIMPIEZA COMPLETA FINALIZADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Tablas restantes: %', table_count;
    RAISE NOTICE '🔒 Políticas RLS restantes: %', policy_count;
    RAISE NOTICE '🔢 Secuencias restantes: %', sequence_count;
    RAISE NOTICE '';

    IF table_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE '✨ Base de datos completamente limpia';
        RAISE NOTICE '➡️  Ahora puedes ejecutar 01-schema-nuevo.sql';
    ELSE
        RAISE NOTICE '⚠️  Aún quedan objetos en la base de datos';
    END IF;
    RAISE NOTICE '========================================';
END $$;

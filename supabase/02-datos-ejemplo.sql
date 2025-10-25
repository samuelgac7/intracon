-- ==============================================================================
-- DATOS DE EJEMPLO PARA TESTEO
-- ==============================================================================
-- Inserta usuarios, trabajadores y obras de ejemplo
-- ==============================================================================

-- ==============================================================================
-- USUARIOS DE EJEMPLO
-- ==============================================================================

INSERT INTO public.usuarios (nombre, rut, email, telefono, cargo, fecha_ingreso, activo, rol, credenciales, permisos) VALUES
(
  'Admin Sistema',
  '11111111-1',
  'admin@tecnycon.cl',
  '+56912345678',
  'Administrador General',
  '2020-01-01',
  true,
  'super-admin',
  '{
    "username": "admin",
    "passwordHash": "$2b$10$am4w719GF.hhsaYDPu5Gh.hXiEe1MPRFGguO4fMFhIJyN6xw5W9nK",
    "mustChangePassword": false,
    "ultimoAcceso": null,
    "intentosFallidos": 0
  }'::jsonb,
  '{
    "trabajadores": {"ver": true, "crear": true, "editar": true, "eliminar": true},
    "obras": {"ver": true, "crear": true, "editar": true, "eliminar": true},
    "documentos": {"ver": true, "subir": true, "eliminar": true},
    "reportes": {"ver": true, "generar": true},
    "configuracion": {"ver": true, "editar": true},
    "finanzas": {"ver": true, "editar": true}
  }'::jsonb
),
(
  'Carlos Fernández',
  '22222222-2',
  'carlos.fernandez@tecnycon.cl',
  '+56987654321',
  'Gerente de Operaciones',
  '2020-03-15',
  true,
  'gerente',
  '{
    "username": "cfernandez",
    "passwordHash": "$2b$10$rA7qH1H/en8Ft3Ot8WSY/e4.tJotVKV/QFv8XSjQPE74LZXP/Q5mG",
    "mustChangePassword": false,
    "ultimoAcceso": null,
    "intentosFallidos": 0
  }'::jsonb,
  '{
    "trabajadores": {"ver": true, "crear": true, "editar": true, "eliminar": true},
    "obras": {"ver": true, "crear": true, "editar": true, "eliminar": true},
    "documentos": {"ver": true, "subir": true, "eliminar": true},
    "reportes": {"ver": true, "generar": true},
    "configuracion": {"ver": true, "editar": false},
    "finanzas": {"ver": true, "editar": true}
  }'::jsonb
),
(
  'María González',
  '33333333-3',
  'maria.gonzalez@tecnycon.cl',
  '+56956789012',
  'Visitador de Obras',
  '2021-06-10',
  true,
  'visitador',
  '{
    "username": "mgonzalez",
    "passwordHash": "$2b$10$OBRKC5ygq4fsrKSZT1vEDuKGdZvBymTftt52rhYm2vWquSUU8j/Q6",
    "mustChangePassword": false,
    "ultimoAcceso": null,
    "intentosFallidos": 0
  }'::jsonb,
  '{
    "trabajadores": {"ver": true, "crear": true, "editar": true, "eliminar": false},
    "obras": {"ver": true, "crear": false, "editar": true, "eliminar": false},
    "documentos": {"ver": true, "subir": true, "eliminar": false},
    "reportes": {"ver": true, "generar": true},
    "configuracion": {"ver": false, "editar": false},
    "finanzas": {"ver": false, "editar": false}
  }'::jsonb
),
(
  'Pedro Ramírez',
  '44444444-4',
  'pedro.ramirez@tecnycon.cl',
  '+56923456789',
  'Ingeniero en Construcción',
  '2021-09-01',
  true,
  'profesional',
  '{
    "username": "pramirez",
    "passwordHash": "$2b$10$eW9wbnaqvSoGPUGRkdl5quDe/unxrBnjp0ok8jJJYlsWASTN.gJhi",
    "mustChangePassword": false,
    "ultimoAcceso": null,
    "intentosFallidos": 0
  }'::jsonb,
  '{
    "trabajadores": {"ver": true, "crear": false, "editar": false, "eliminar": false},
    "obras": {"ver": true, "crear": false, "editar": false, "eliminar": false},
    "documentos": {"ver": true, "subir": false, "eliminar": false},
    "reportes": {"ver": true, "generar": true},
    "configuracion": {"ver": false, "editar": false},
    "finanzas": {"ver": false, "editar": false}
  }'::jsonb
),
(
  'Ana Martínez',
  '55555555-5',
  'ana.martinez@tecnycon.cl',
  '+56945678901',
  'Contador',
  '2022-01-15',
  true,
  'profesional',
  '{
    "username": "amartinez",
    "passwordHash": "$2b$10$ZemCFxN0wbIAsG.TlFm.DuzmE6A8mH7/ixlXACBrPKRlXVcm0oC/u",
    "mustChangePassword": false,
    "ultimoAcceso": null,
    "intentosFallidos": 0
  }'::jsonb,
  '{
    "trabajadores": {"ver": true, "crear": false, "editar": false, "eliminar": false},
    "obras": {"ver": true, "crear": false, "editar": false, "eliminar": false},
    "documentos": {"ver": true, "subir": false, "eliminar": false},
    "reportes": {"ver": true, "generar": true},
    "configuracion": {"ver": false, "editar": false},
    "finanzas": {"ver": true, "editar": false}
  }'::jsonb
);


-- ==============================================================================
-- TRABAJADORES DE EJEMPLO
-- ==============================================================================

INSERT INTO public.trabajadores (
  nombre, rut, email, telefono, direccion, comuna, region, cargo, especialidad, categoria,
  fecha_ingreso, salario, tipo_contrato, tipo_jornada, afp, prevision, banco, tipo_cuenta, estado
) VALUES
(
  'Juan Pérez Soto',
  '12345678-9',
  'juan.perez@email.com',
  '+56912341234',
  'Los Aromos 123',
  'Maipú',
  'Metropolitana',
  'Maestro de Obra',
  'Construcción General',
  'A',
  '2019-03-15',
  '850000',
  'indefinido',
  'completa',
  'Habitat',
  'fonasa',
  'Banco Estado',
  'vista',
  'activo'
),
(
  'Miguel Torres López',
  '12345679-0',
  'miguel.torres@email.com',
  '+56912342345',
  'Las Rosas 456',
  'Puente Alto',
  'Metropolitana',
  'Maestro Albañil',
  'Albañilería',
  'A',
  '2019-07-20',
  '780000',
  'indefinido',
  'completa',
  'Provida',
  'fonasa',
  'Banco Chile',
  'vista',
  'activo'
),
(
  'Roberto Silva Muñoz',
  '12345680-1',
  'roberto.silva@email.com',
  '+56912343456',
  'San Martín 789',
  'La Florida',
  'Metropolitana',
  'Maestro Carpintero',
  'Carpintería',
  'A',
  '2020-01-10',
  '750000',
  'indefinido',
  'completa',
  'Capital',
  'fonasa',
  'Scotiabank',
  'corriente',
  'activo'
),
(
  'Carlos Díaz Rojas',
  '12345681-2',
  'carlos.diaz@email.com',
  '+56912344567',
  'Avenida Grecia 321',
  'Ñuñoa',
  'Metropolitana',
  'Oficial Albañil',
  'Albañilería',
  'B',
  '2020-05-18',
  '620000',
  'plazo-fijo',
  'completa',
  'Habitat',
  'fonasa',
  'Banco Estado',
  'rut',
  'activo'
),
(
  'Luis Morales Castro',
  '12345682-3',
  'luis.morales@email.com',
  '+56912345678',
  'Los Olivos 654',
  'San Bernardo',
  'Metropolitana',
  'Oficial Carpintero',
  'Carpintería',
  'B',
  '2020-08-25',
  '600000',
  'indefinido',
  'completa',
  'Provida',
  'fonasa',
  'Banco Chile',
  'vista',
  'activo'
),
(
  'Jorge Hernández Vega',
  '12345683-4',
  'jorge.hernandez@email.com',
  '+56912346789',
  'Las Acacias 987',
  'Quilicura',
  'Metropolitana',
  'Oficial Electricista',
  'Electricidad',
  'B',
  '2021-02-14',
  '650000',
  'indefinido',
  'completa',
  'Capital',
  'isapre',
  'Consalud',
  'corriente',
  'activo'
),
(
  'Francisco Vargas Soto',
  '12345684-5',
  'francisco.vargas@email.com',
  '+56912347890',
  'Camino El Alto 234',
  'Renca',
  'Metropolitana',
  'Ayudante General',
  'Construcción General',
  'C',
  '2021-06-01',
  '480000',
  'plazo-fijo',
  'completa',
  'Habitat',
  'fonasa',
  'Banco Estado',
  'rut',
  'activo'
),
(
  'Daniel Núñez Parra',
  '12345685-6',
  'daniel.nunez@email.com',
  '+56912348901',
  'Los Pinos 567',
  'Cerro Navia',
  'Metropolitana',
  'Ayudante Carpintero',
  'Carpintería',
  'C',
  '2021-09-10',
  '470000',
  'obra',
  'completa',
  'Provida',
  'fonasa',
  'Banco Chile',
  'vista',
  'activo'
),
(
  'Andrés Contreras Ruiz',
  '12345686-7',
  'andres.contreras@email.com',
  '+56912349012',
  'Santa Rosa 890',
  'La Pintana',
  'Metropolitana',
  'Jornal',
  'Construcción General',
  'D',
  '2022-03-01',
  '420000',
  'obra',
  'completa',
  'Capital',
  'fonasa',
  'Banco Estado',
  'rut',
  'activo'
),
(
  'Patricio Fuentes Lagos',
  '12345687-8',
  'patricio.fuentes@email.com',
  '+56912340123',
  'Avenida Pajaritos 123',
  'Maipú',
  'Metropolitana',
  'Jornal',
  'Construcción General',
  'D',
  '2022-05-15',
  '420000',
  'plazo-fijo',
  'completa',
  'Habitat',
  'fonasa',
  'Scotiabank',
  'vista',
  'activo'
),
(
  'Ricardo Bravo Moreno',
  '12345688-9',
  'ricardo.bravo@email.com',
  '+56912341235',
  'Los Castaños 456',
  'Estación Central',
  'Metropolitana',
  'Maestro Gasfiter',
  'Gasfitería',
  'A',
  '2019-11-20',
  '720000',
  'indefinido',
  'completa',
  'Provida',
  'isapre',
  'Banmédica',
  'corriente',
  'activo'
),
(
  'Sebastián Rojas Campos',
  '12345689-0',
  'sebastian.rojas@email.com',
  '+56912342346',
  'Las Magnolias 789',
  'Pedro Aguirre Cerda',
  'Metropolitana',
  'Oficial Gasfiter',
  'Gasfitería',
  'B',
  '2020-12-05',
  '590000',
  'indefinido',
  'completa',
  'Capital',
  'fonasa',
  'Banco Chile',
  'vista',
  'activo'
),
(
  'Cristián Navarro Inostroza',
  '12345690-1',
  'cristian.navarro@email.com',
  '+56912343457',
  'El Roble 321',
  'Cerrillos',
  'Metropolitana',
  'Maestro Pintor',
  'Pintura',
  'A',
  '2020-02-28',
  '680000',
  'indefinido',
  'completa',
  'Habitat',
  'fonasa',
  'Banco Estado',
  'rut',
  'activo'
),
(
  'Rodrigo Sandoval Espinoza',
  '12345691-2',
  'rodrigo.sandoval@email.com',
  '+56912344568',
  'San Diego 654',
  'Santiago Centro',
  'Metropolitana',
  'Oficial Pintor',
  'Pintura',
  'B',
  '2021-04-12',
  '570000',
  'indefinido',
  'completa',
  'Provida',
  'fonasa',
  'Banco Chile',
  'vista',
  'activo'
),
(
  'Mauricio Pinto Álvarez',
  '12345692-3',
  'mauricio.pinto@email.com',
  '+56912345679',
  'Brasil 987',
  'Santiago Centro',
  'Metropolitana',
  'Ayudante Eléctrico',
  'Electricidad',
  'C',
  '2021-10-08',
  '460000',
  'obra',
  'completa',
  'Capital',
  'fonasa',
  'Scotiabank',
  'vista',
  'activo'
);


-- ==============================================================================
-- OBRAS DE EJEMPLO
-- ==============================================================================

INSERT INTO public.obras (
  nombre, codigo, tipo, cliente, rut_cliente, direccion, comuna, region,
  descripcion, fecha_inicio, fecha_termino_estimada, monto_contrato, encargado_id, estado, progreso
) VALUES
(
  'Edificio Las Condes Business',
  'OB-2024-001',
  'construccion',
  'Inmobiliaria Los Andes S.A.',
  '76123456-7',
  'Avenida Apoquindo 3500',
  'Las Condes',
  'Metropolitana',
  'Construcción de edificio de oficinas de 15 pisos con subterráneos',
  '2024-01-15',
  '2025-06-30',
  850000000,
  1, -- Admin Sistema
  'en-progreso',
  35
),
(
  'Remodelación Hospital San José',
  'OB-2024-002',
  'remodelacion',
  'Servicio de Salud Metropolitano Norte',
  '61234567-8',
  'Calle San José 1234',
  'Independencia',
  'Metropolitana',
  'Remodelación de pabellón y áreas comunes del hospital',
  '2024-03-01',
  '2024-12-15',
  320000000,
  2, -- Carlos Fernández
  'en-progreso',
  60
),
(
  'Condominio Valle Verde',
  'OB-2024-003',
  'construccion',
  'Inmobiliaria Verde Ltda.',
  '77234567-9',
  'Camino El Valle 5678',
  'Colina',
  'Metropolitana',
  'Construcción de 80 casas en condominio cerrado',
  '2024-02-20',
  '2025-08-30',
  1200000000,
  2, -- Carlos Fernández
  'en-progreso',
  45
),
(
  'Mall Portal Sur',
  'OB-2023-015',
  'construccion',
  'Grupo Retail SpA',
  '78345678-0',
  'Avenida Observatorio 2000',
  'La Florida',
  'Metropolitana',
  'Construcción de centro comercial de 3 pisos',
  '2023-06-01',
  '2024-11-30',
  1800000000,
  1, -- Admin Sistema
  'en-progreso',
  85
),
(
  'Colegio Nuevo Horizonte',
  'OB-2024-004',
  'construccion',
  'Fundación Educacional Horizonte',
  '72456789-1',
  'Los Naranjos 890',
  'Maipú',
  'Metropolitana',
  'Construcción de establecimiento educacional de 2 pisos con patio central',
  '2024-04-10',
  '2024-12-20',
  450000000,
  3, -- María González
  'en-progreso',
  25
),
(
  'Planta Industrial MetalTech',
  'OB-2024-005',
  'construccion',
  'MetalTech Industries S.A.',
  '79567890-2',
  'Camino Industrial Km 12',
  'Quilicura',
  'Metropolitana',
  'Construcción de planta industrial de procesamiento de metales',
  '2024-05-01',
  '2025-03-31',
  980000000,
  2, -- Carlos Fernández
  'planificacion',
  5
);


-- ==============================================================================
-- ASIGNACIONES TRABAJADORES - OBRAS
-- ==============================================================================

-- Edificio Las Condes Business (Obra 1)
INSERT INTO public.trabajadores_obras (trabajador_id, obra_id, cargo_en_obra, fecha_asignacion, activo) VALUES
(1, 1, 'Maestro de Obra', '2024-01-15', true),
(2, 1, 'Maestro Albañil', '2024-01-15', true),
(3, 1, 'Maestro Carpintero', '2024-01-20', true),
(4, 1, 'Oficial Albañil', '2024-01-20', true),
(5, 1, 'Oficial Carpintero', '2024-01-25', true),
(7, 1, 'Ayudante General', '2024-02-01', true),
(9, 1, 'Jornal', '2024-02-10', true);

-- Remodelación Hospital San José (Obra 2)
INSERT INTO public.trabajadores_obras (trabajador_id, obra_id, cargo_en_obra, fecha_asignacion, activo) VALUES
(11, 2, 'Maestro Gasfiter', '2024-03-01', true),
(6, 2, 'Oficial Electricista', '2024-03-01', true),
(13, 2, 'Maestro Pintor', '2024-03-05', true),
(14, 2, 'Oficial Pintor', '2024-03-05', true),
(15, 2, 'Ayudante Eléctrico', '2024-03-10', true);

-- Condominio Valle Verde (Obra 3)
INSERT INTO public.trabajadores_obras (trabajador_id, obra_id, cargo_en_obra, fecha_asignacion, activo) VALUES
(1, 3, 'Maestro de Obra', '2024-02-20', true),
(2, 3, 'Maestro Albañil', '2024-02-20', true),
(3, 3, 'Maestro Carpintero', '2024-02-25', true),
(4, 3, 'Oficial Albañil', '2024-02-25', true),
(5, 3, 'Oficial Carpintero', '2024-03-01', true),
(8, 3, 'Ayudante Carpintero', '2024-03-01', true),
(10, 3, 'Jornal', '2024-03-05', true);

-- Mall Portal Sur (Obra 4)
INSERT INTO public.trabajadores_obras (trabajador_id, obra_id, cargo_en_obra, fecha_asignacion, activo) VALUES
(2, 4, 'Maestro Albañil', '2023-06-01', true),
(4, 4, 'Oficial Albañil', '2023-06-01', true),
(6, 4, 'Oficial Electricista', '2023-06-15', true),
(11, 4, 'Maestro Gasfiter', '2023-06-15', true),
(12, 4, 'Oficial Gasfiter', '2023-06-20', true),
(13, 4, 'Maestro Pintor', '2024-01-10', true),
(14, 4, 'Oficial Pintor', '2024-01-10', true);

-- Colegio Nuevo Horizonte (Obra 5)
INSERT INTO public.trabajadores_obras (trabajador_id, obra_id, cargo_en_obra, fecha_asignacion, activo) VALUES
(1, 5, 'Maestro de Obra', '2024-04-10', true),
(3, 5, 'Maestro Carpintero', '2024-04-10', true),
(5, 5, 'Oficial Carpintero', '2024-04-15', true),
(7, 5, 'Ayudante General', '2024-04-15', true),
(9, 5, 'Jornal', '2024-04-20', true);


-- ==============================================================================
-- RESULTADO
-- ==============================================================================

DO $$
DECLARE
  total_usuarios integer;
  total_trabajadores integer;
  total_obras integer;
  total_asignaciones integer;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM usuarios;
  SELECT COUNT(*) INTO total_trabajadores FROM trabajadores;
  SELECT COUNT(*) INTO total_obras FROM obras;
  SELECT COUNT(*) INTO total_asignaciones FROM trabajadores_obras;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '           DATOS DE EJEMPLO INSERTADOS';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ % usuarios creados', total_usuarios;
  RAISE NOTICE '✅ % trabajadores creados', total_trabajadores;
  RAISE NOTICE '✅ % obras creadas', total_obras;
  RAISE NOTICE '✅ % asignaciones trabajador-obra creadas', total_asignaciones;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 USUARIOS DE PRUEBA:';
  RAISE NOTICE '   - admin / admin (Super Admin)';
  RAISE NOTICE '   - cfernandez / cfernandez (Gerente)';
  RAISE NOTICE '   - mgonzalez / mgonzalez (Visitador)';
  RAISE NOTICE '   - pramirez / pramirez (Profesional)';
  RAISE NOTICE '   - amartinez / amartinez (Profesional)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTA: Los passwords son iguales a los usernames para testing';
  RAISE NOTICE '⚠️  Cambiar en producción!';
  RAISE NOTICE '';
END $$;

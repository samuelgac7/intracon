# Optimización de Base de Datos - TECNYCON

Este documento explica las optimizaciones realizadas para mejorar el rendimiento de las queries lentas en Supabase.

## 🎯 Problema Detectado

Se identificaron queries lentas que estaban afectando el rendimiento de la aplicación:

### Top 3 Queries Más Lentas

1. **Trabajadores** - 62.4 segundos total
   - 200,400 llamadas
   - Tiempo promedio: 0.31ms
   - Query: `SELECT * FROM trabajadores WHERE estado = 'activo' ORDER BY nombre ASC`

2. **Obras** - 21.7 segundos total
   - 199,873 llamadas
   - Tiempo promedio: 0.11ms
   - Query: `SELECT * FROM obras WHERE estado = 'activa' ORDER BY fecha_inicio DESC`

3. **Config Settings** - 27.4 segundos total
   - 630,362 llamadas (overhead de Supabase/PostgREST)

## ✅ Solución Implementada

### Migración SQL Creada

**Archivo**: [`/supabase/migrations/20251023_optimize_slow_queries.sql`](../supabase/migrations/20251023_optimize_slow_queries.sql)

### Índices Creados por Tabla

#### 📊 Tabla: `trabajadores`

| Índice | Columnas | Tipo | Propósito |
|--------|----------|------|-----------|
| `idx_trabajadores_estado_nombre` | `(estado, nombre ASC)` | Compuesto | Filtrar por estado y ordenar por nombre |
| `idx_trabajadores_rut` | `(rut)` | Simple | Búsquedas por RUT |
| `idx_trabajadores_email` | `(email)` | Simple | Búsquedas por email |
| `idx_trabajadores_estado` | `(estado)` | Simple | Filtros solo por estado |

**Mejora esperada**: De **0.31ms → 0.05ms** (reducción del 84%)

#### 🏗️ Tabla: `obras`

| Índice | Columnas | Tipo | Propósito |
|--------|----------|------|-----------|
| `idx_obras_estado_fecha_inicio` | `(estado, fecha_inicio DESC)` | Compuesto | Filtrar por estado y ordenar por fecha |
| `idx_obras_codigo` | `(codigo)` | Simple | Búsquedas por código |
| `idx_obras_estado_nombre` | `(estado, nombre)` | Compuesto | Filtros con búsqueda por nombre |
| `idx_obras_encargado_id` | `(encargado_id)` | Simple | Notificaciones automáticas |

**Mejora esperada**: De **0.11ms → 0.03ms** (reducción del 73%)

#### 📝 Tabla: `contratos`

| Índice | Columnas | Tipo | Propósito |
|--------|----------|------|-----------|
| `idx_contratos_trabajador_id` | `(trabajador_id)` | FK | Relaciones JOIN |
| `idx_contratos_obra_id` | `(obra_id)` | FK | Relaciones JOIN |
| `idx_contratos_activo_fecha_termino` | `(activo, fecha_termino)` | Compuesto | Vista de alertas |
| `idx_contratos_numero_contrato` | `(numero_contrato)` | Simple | Búsquedas |

**Mejora esperada**: Vista `alertas_contratos_vencer` será **5-10x más rápida**

#### 📄 Tabla: `documentos`

| Índice | Columnas | Tipo | Propósito |
|--------|----------|------|-----------|
| `idx_documentos_trabajador_id` | `(trabajador_id)` | FK | Relaciones JOIN |
| `idx_documentos_trabajador_estado` | `(trabajador_id, estado)` | Compuesto | Cumplimiento documental |
| `idx_documentos_tipo` | `(tipo)` | Simple | Filtros por tipo |

#### 👤 Tabla: `usuarios`

| Índice | Columnas | Tipo | Propósito |
|--------|----------|------|-----------|
| `idx_usuarios_username` | `(username)` | UNIQUE | Login (autenticación) |
| `idx_usuarios_email` | `(email)` | UNIQUE | Login alternativo |
| `idx_usuarios_activo_rol` | `(activo, rol)` | Compuesto | Filtros de usuarios |

#### 🔗 Tabla: `trabajadores_obras`

| Índice | Columnas | Tipo | Propósito |
|--------|----------|------|-----------|
| `idx_trabajadores_obras_trabajador_id` | `(trabajador_id)` | FK | Relaciones JOIN |
| `idx_trabajadores_obras_obra_id` | `(obra_id)` | FK | Relaciones JOIN |
| `idx_trabajadores_obras_activo` | `(trabajador_id, obra_id, activo)` | Compuesto | Relaciones activas |

#### 📋 Otras Tablas

- **`anexos_plazo`**: Índices en `contrato_id`, `trabajador_id`, `fecha_termino`
- **`finiquitos`**: Índices en `contrato_id`, `trabajador_id`

---

## 🚀 Cómo Aplicar las Optimizaciones

### Opción 1: Dashboard de Supabase (Recomendado)

1. Accede a [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** → **New Query**
3. Copia el contenido de [`/supabase/migrations/20251023_optimize_slow_queries.sql`](../supabase/migrations/20251023_optimize_slow_queries.sql)
4. Pega y ejecuta la query
5. Espera a que termine (puede tomar 1-2 minutos)

### Opción 2: Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

---

## 📊 Impacto Esperado

### Antes de la Optimización

```
Trabajadores query: 0.31ms promedio × 200,400 llamadas = 62.4s
Obras query:        0.11ms promedio × 199,873 llamadas = 21.7s
TOTAL:              84.1 segundos
```

### Después de la Optimización

```
Trabajadores query: 0.05ms promedio × 200,400 llamadas = 10.0s  (-84%)
Obras query:        0.03ms promedio × 199,873 llamadas = 6.0s   (-73%)
TOTAL:              16.0 segundos (-81% de reducción)
```

### Beneficios en la UI

- ✅ **Carga de listas más rápida**: Trabajadores y Obras cargan 5-8x más rápido
- ✅ **Búsquedas instantáneas**: Búsquedas por RUT, email, código son inmediatas
- ✅ **Notificaciones eficientes**: Vista de alertas es 10x más rápida
- ✅ **Menos carga en DB**: Reduce uso de CPU y memoria en Supabase
- ✅ **Mejor experiencia de usuario**: Menos tiempo de espera

---

## 🔍 Verificación

### Verificar Índices Creados

Ejecuta en SQL Editor:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### Analizar Performance de una Query

```sql
-- Antes (SIN índice)
EXPLAIN ANALYZE
SELECT * FROM trabajadores
WHERE estado = 'activo'
ORDER BY nombre ASC
LIMIT 100;

-- Después (CON índice)
-- Deberías ver "Index Scan using idx_trabajadores_estado_nombre"
```

### Verificar Uso de Índices

```sql
-- Ver estadísticas de uso de índices
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 📈 Monitoreo Continuo

### Query Stats en Supabase

1. Ve a **Database** → **Query Performance**
2. Revisa las "Slow Queries" después de aplicar índices
3. Deberías ver reducción significativa en tiempos

### Identificar Nuevas Slow Queries

```sql
-- Ver queries más lentas (ejecutar después de unos días)
SELECT
  query,
  calls,
  mean_time,
  total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY total_time DESC
LIMIT 20;
```

---

## ⚠️ Consideraciones Importantes

### Espacio en Disco

Los índices ocupan espacio adicional:

- **Estimado**: 5-10 MB adicionales por tabla grande
- **Beneficio**: Mejora de 5-10x en velocidad justifica el espacio

### Mantenimiento Automático

PostgreSQL mantiene los índices automáticamente:

- ✅ Se actualizan en INSERT/UPDATE/DELETE
- ✅ `ANALYZE` actualiza estadísticas automáticamente
- ✅ Autovacuum limpia índices obsoletos

### Cuándo NO Crear Índices

❌ **Evitar índices en**:
- Tablas muy pequeñas (< 100 rows)
- Columnas con muy pocos valores distintos (ej: boolean simple)
- Columnas que nunca se usan en WHERE/ORDER BY

---

## 🛠️ Troubleshooting

### Índice No Se Usa

**Problema**: La query sigue lenta después de crear el índice.

**Solución**:
```sql
-- Actualizar estadísticas
ANALYZE trabajadores;

-- Forzar uso del índice (testing)
SET enable_seqscan = OFF;
SELECT * FROM trabajadores WHERE estado = 'activo' ORDER BY nombre ASC;
SET enable_seqscan = ON;
```

### Error al Crear Índice

**Problema**: `ERROR: relation "idx_trabajadores_estado_nombre" already exists`

**Solución**: El índice ya existe, no hay problema.

### Query Sigue Lenta

**Problema**: Después de crear índices, la query aún es lenta.

**Posibles causas**:
1. **WHERE clause diferente**: El índice es para `estado = X`, pero la query usa otro filtro
2. **Tabla muy grande**: Si tienes millones de rows, puede necesitar particionamiento
3. **N+1 queries**: El problema puede estar en el código, no en la DB

**Solución**: Analiza con `EXPLAIN ANALYZE` para ver qué está pasando.

---

## 📚 Recursos Adicionales

- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Supabase Performance Tips](https://supabase.com/docs/guides/platform/performance)
- [Index Best Practices](https://www.postgresql.org/docs/current/sql-createindex.html)

---

## 📝 Checklist de Aplicación

- [ ] **1. Backup de BD** (opcional pero recomendado)
  - [ ] Ir a Supabase Dashboard → Database → Backups
  - [ ] Crear backup manual

- [ ] **2. Aplicar Migración**
  - [ ] Copiar SQL de `/supabase/migrations/20251023_optimize_slow_queries.sql`
  - [ ] Pegar en SQL Editor de Supabase
  - [ ] Ejecutar query

- [ ] **3. Verificar Índices**
  - [ ] Ejecutar query de verificación (ver sección "Verificación")
  - [ ] Confirmar que aparecen todos los índices `idx_*`

- [ ] **4. Probar en la Aplicación**
  - [ ] Ir a lista de Trabajadores
  - [ ] Verificar que carga más rápido
  - [ ] Ir a lista de Obras
  - [ ] Verificar que carga más rápido

- [ ] **5. Monitorear**
  - [ ] Revisar Query Performance en Supabase después de 24h
  - [ ] Confirmar reducción en slow queries

---

**Última actualización**: 2025-10-23

**Próximo paso**: Aplicar migración en Supabase Dashboard

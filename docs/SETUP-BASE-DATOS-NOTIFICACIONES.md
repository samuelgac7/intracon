# Configuración de Base de Datos para Notificaciones Automáticas

Este documento explica cómo configurar la base de datos de Supabase para que el sistema de notificaciones automáticas funcione correctamente.

## 📋 Requisito

El sistema de notificaciones requiere una **vista de base de datos** llamada `alertas_contratos_vencer` que proporciona información sobre contratos próximos a vencer.

## 🔧 Opción 1: Aplicar desde el Dashboard de Supabase (Recomendado)

### Paso 1: Acceder al SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query**

### Paso 2: Copiar y Ejecutar el SQL

Copia y pega el siguiente SQL en el editor:

```sql
-- ============================================================================
-- Migration: Crear vista alertas_contratos_vencer
-- Descripción: Vista que proporciona alertas de contratos próximos a vencer
--              para el sistema de notificaciones automáticas
-- ============================================================================

-- Eliminar vista si existe (para permitir recrearla)
DROP VIEW IF EXISTS alertas_contratos_vencer;

-- Crear vista con todos los contratos que vencen en los próximos 30 días
CREATE OR REPLACE VIEW alertas_contratos_vencer AS
SELECT
  c.id,
  c.numero_contrato,
  c.trabajador_id,
  t.nombre AS trabajador_nombre,
  t.rut AS trabajador_rut,
  c.obra_id,
  o.nombre AS obra_nombre,
  c.fecha_termino,
  (c.fecha_termino::date - CURRENT_DATE) AS dias_restantes,
  CASE
    WHEN c.fecha_termino::date < CURRENT_DATE THEN 'VENCIDO'::text
    WHEN c.fecha_termino::date = CURRENT_DATE THEN 'VENCE_HOY'::text
    ELSE 'POR_VENCER'::text
  END AS urgencia
FROM contratos c
INNER JOIN trabajadores t ON t.id = c.trabajador_id
INNER JOIN obras o ON o.id = c.obra_id
WHERE c.fecha_termino IS NOT NULL
  AND c.activo = true
  AND c.fecha_termino::date <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY dias_restantes ASC;

-- Comentario en la vista
COMMENT ON VIEW alertas_contratos_vencer IS
'Vista que proporciona alertas de contratos próximos a vencer (30 días).
Utilizada por el sistema de notificaciones automáticas para enviar emails
a profesionales encargados 7 días antes del vencimiento.';
```

### Paso 3: Ejecutar la Query

1. Haz clic en el botón **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
2. Deberías ver el mensaje: **Success. No rows returned**

### Paso 4: Verificar que la Vista Existe

Ejecuta esta query para verificar:

```sql
SELECT * FROM alertas_contratos_vencer LIMIT 5;
```

Si ves resultados (o un mensaje de "0 rows" pero sin error), ¡la vista está creada correctamente!

## 🔧 Opción 2: Usando Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

### Paso 1: Instalar Supabase CLI

```bash
# En macOS/Linux
brew install supabase/tap/supabase

# O con npm
npm install -g supabase
```

### Paso 2: Login y Link

```bash
# Iniciar sesión
supabase login

# Vincular tu proyecto
supabase link --project-ref TU_PROJECT_REF
```

### Paso 3: Aplicar la Migración

```bash
# Aplicar la migración
supabase db push
```

## ✅ Verificación Final

Una vez creada la vista, puedes probar el sistema completo:

### 1. Verificar la Vista Manualmente

En el SQL Editor de Supabase:

```sql
-- Ver todos los contratos próximos a vencer
SELECT * FROM alertas_contratos_vencer;

-- Ver solo contratos que vencen en 7 días (los que se notificarán)
SELECT * FROM alertas_contratos_vencer WHERE dias_restantes = 7;

-- Ver contratos vencidos
SELECT * FROM alertas_contratos_vencer WHERE urgencia = 'VENCIDO';
```

### 2. Probar desde la Aplicación

1. Inicia sesión como **super-admin**
2. Ve a **Recursos Humanos** → **Gestión Documental**
3. Haz clic en el botón **Enviar Notificaciones**
4. Deberías ver un mensaje de éxito

### 3. Probar desde la API

```bash
curl -X POST http://localhost:3002/api/notificaciones/contratos-vencer \
  -H "x-api-key: tecnycon-cron-secret-2025"
```

Deberías recibir:

```json
{
  "success": true,
  "mensaje": "Notificaciones enviadas exitosamente",
  "notificacionesEnviadas": 2,
  "errores": []
}
```

## 🔍 Troubleshooting

### Error: "Could not find the table 'public.alertas_contratos_vencer'"

**Causa**: La vista no existe todavía.

**Solución**: Ejecuta el SQL de la Opción 1 desde el dashboard de Supabase.

### Error: "relation 'contratos' does not exist"

**Causa**: Falta la tabla `contratos` en la base de datos.

**Solución**: Verifica que tu base de datos tiene las tablas `contratos`, `trabajadores` y `obras`.

### Error: "column c.activo does not exist"

**Causa**: La tabla `contratos` no tiene la columna `activo`.

**Solución**: Modifica la query SQL eliminando la línea:
```sql
AND c.activo = true
```

### No se envían emails

**Causa**: No hay contratos que venzan en exactamente 7 días.

**Solución**: La función solo envía notificaciones para contratos que vencen en **exactamente 7 días**. Verifica con:

```sql
SELECT * FROM alertas_contratos_vencer WHERE dias_restantes = 7;
```

## 📊 Estructura de Datos

La vista `alertas_contratos_vencer` retorna:

| Campo               | Tipo    | Descripción                           |
|---------------------|---------|---------------------------------------|
| id                  | integer | ID del contrato                       |
| numero_contrato     | text    | Número de contrato                    |
| trabajador_id       | integer | ID del trabajador                     |
| trabajador_nombre   | text    | Nombre completo del trabajador        |
| trabajador_rut      | text    | RUT del trabajador                    |
| obra_id             | integer | ID de la obra                         |
| obra_nombre         | text    | Nombre de la obra                     |
| fecha_termino       | date    | Fecha de término del contrato         |
| dias_restantes      | integer | Días hasta el vencimiento             |
| urgencia            | text    | VENCIDO, VENCE_HOY, o POR_VENCER      |

## 🎯 Próximos Pasos

Una vez configurada la base de datos:

1. ✅ Crear la vista `alertas_contratos_vencer` (este documento)
2. 📧 Configurar las notificaciones automáticas (ver `NOTIFICACIONES-AUTOMATICAS.md`)
3. ⏰ Configurar el cron job para ejecución diaria
4. 🧪 Probar el envío manual desde la UI
5. 📊 Monitorear los logs de notificaciones enviadas

## 📝 Notas Importantes

- La vista se actualiza automáticamente cada vez que se consulta
- Solo muestra contratos activos que vencen en los próximos 30 días
- Los contratos sin `fecha_termino` no aparecen en la vista
- El sistema envía notificaciones solo para contratos que vencen en **7 días exactos**

---

**¿Necesitas ayuda?** Consulta la documentación completa en `/docs/NOTIFICACIONES-AUTOMATICAS.md`

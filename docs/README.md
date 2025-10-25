# Documentación TECNYCON - Sistema de Gestión

Bienvenido a la documentación del sistema de gestión empresarial TECNYCON.

## 📚 Índice de Documentación

### 🔔 Notificaciones Automáticas

Sistema de notificaciones por email para contratos próximos a vencer.

1. **[SETUP-BASE-DATOS-NOTIFICACIONES.md](./SETUP-BASE-DATOS-NOTIFICACIONES.md)** ⭐ **EMPEZAR AQUÍ**
   - Configuración de la base de datos (vista `alertas_contratos_vencer`)
   - Paso a paso para aplicar la migración en Supabase
   - Verificación y troubleshooting

2. **[NOTIFICACIONES-AUTOMATICAS.md](./NOTIFICACIONES-AUTOMATICAS.md)**
   - Uso del sistema de notificaciones
   - Configuración de cron jobs para envío automático
   - Opciones de deployment (servidor, online, Vercel)

---

## 🚀 Inicio Rápido - Notificaciones

### Paso 1: Configurar Base de Datos

1. Accede a [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** → **New Query**
3. Copia el SQL de [SETUP-BASE-DATOS-NOTIFICACIONES.md](./SETUP-BASE-DATOS-NOTIFICACIONES.md)
4. Ejecuta la query

### Paso 2: Probar Manualmente

1. Inicia sesión como **super-admin**
2. Ve a **Recursos Humanos** → **Gestión Documental**
3. Haz clic en **Enviar Notificaciones**

### Paso 3: Automatizar (Opcional)

Sigue las instrucciones en [NOTIFICACIONES-AUTOMATICAS.md](./NOTIFICACIONES-AUTOMATICAS.md) para configurar el envío diario automático.

---

## 🔧 Archivos de Migración

### `/supabase/migrations/`

- **`20251023_create_alertas_contratos_view.sql`**
  - Crea la vista `alertas_contratos_vencer`
  - Necesaria para el sistema de notificaciones

---

## 📋 Checklist de Implementación

Usa este checklist para implementar el sistema de notificaciones:

- [ ] **1. Base de Datos**
  - [ ] Crear vista `alertas_contratos_vencer` en Supabase
  - [ ] Verificar con `SELECT * FROM alertas_contratos_vencer LIMIT 5`

- [ ] **2. Variables de Entorno**
  - [ ] Verificar que `RESEND_API_KEY` está configurada en `.env.local`
  - [ ] Verificar que `EMAIL_FROM` está configurada
  - [ ] Verificar que `CRON_API_KEY` está configurada

- [ ] **3. Pruebas**
  - [ ] Probar envío manual desde UI (botón "Enviar Notificaciones")
  - [ ] Probar API endpoint con curl
  - [ ] Verificar que los emails llegan correctamente

- [ ] **4. Automatización**
  - [ ] Elegir método de cron (servidor, online, o Vercel)
  - [ ] Configurar cron job para ejecución diaria
  - [ ] Verificar logs de ejecución

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa la sección **Troubleshooting** en cada documento
2. Verifica los logs del servidor Next.js
3. Verifica los logs de Supabase
4. Revisa la configuración de variables de entorno

---

## 📝 Notas Importantes

- Las notificaciones se envían **solo a profesionales encargados de obras**
- Solo se notifican contratos que vencen en **exactamente 7 días**
- Los emails incluyen todos los trabajadores de la obra con contratos por vencer
- El sistema respeta las **obras asignadas** a cada usuario

---

**Última actualización**: 2025-10-23

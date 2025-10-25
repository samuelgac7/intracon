# Notificaciones Automáticas - Contratos por Vencer

Este documento explica cómo funcionan las notificaciones automáticas de contratos próximos a vencer.

## ⚠️ REQUISITO PREVIO

**IMPORTANTE**: Antes de usar este sistema, debes configurar la base de datos.

👉 **Ver guía completa**: [SETUP-BASE-DATOS-NOTIFICACIONES.md](./SETUP-BASE-DATOS-NOTIFICACIONES.md)

El sistema requiere una vista de base de datos llamada `alertas_contratos_vencer`. Si no la has creado, las notificaciones NO funcionarán.

---

## 📋 ¿Qué hace el sistema?

El sistema envía **notificaciones por email a los profesionales encargados de cada obra** cuando hay contratos que vencen en **7 días**.

### Características:

- ✅ **Envío automático diario** (si se configura el cron job)
- ✅ **Solo contratos que vencen en exactamente 7 días**
- ✅ **Un email por obra** al profesional encargado
- ✅ **Incluye tabla con todos los trabajadores** de esa obra con contratos por vencer
- ✅ **Respeta las obras asignadas** (si el usuario tiene obras específicas)

---

## 🚀 Uso Manual (Testing)

Para probar el envío de notificaciones manualmente:

1. Ir a **Recursos Humanos → Gestión Documental**
2. Hacer clic en el botón **"Enviar Notificaciones"** (solo visible para super-admin)
3. Confirmar el envío
4. El sistema enviará emails a todos los profesionales que tengan obras con contratos que vencen en 7 días

---

## ⚙️ Configuración Automática (Cron Job)

Para que las notificaciones se envíen automáticamente todos los días, necesitas configurar un cron job.

### Opción 1: Cron Job del Servidor (Linux/macOS)

1. Abre el crontab:
```bash
crontab -e
```

2. Agrega esta línea (se ejecutará todos los días a las 8:00 AM):
```bash
0 8 * * * curl -X POST https://tu-dominio.com/api/notificaciones/contratos-vencer -H "x-api-key: tecnycon-cron-secret-2025"
```

3. Guarda y cierra el editor

### Opción 2: Servicio de Cron Jobs Online

Si no tienes acceso al servidor, usa un servicio como:

- **cron-job.org** (gratis, recomendado)
- **EasyCron**
- **Cronitor**

#### Pasos para cron-job.org:

1. Crear cuenta en https://cron-job.org
2. Crear nuevo cron job con:
   - **URL**: `https://tu-dominio.com/api/notificaciones/contratos-vencer`
   - **Método**: POST
   - **Headers**:
     - Key: `x-api-key`
     - Value: `tecnycon-cron-secret-2025`
   - **Frecuencia**: Diaria a las 8:00 AM (Chile/Santiago)

### Opción 3: Vercel Cron Jobs (si usas Vercel)

1. Crear archivo `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [{
    "path": "/api/notificaciones/contratos-vencer",
    "schedule": "0 11 * * *"
  }]
}
```

**Nota**: `0 11 * * *` es 11:00 UTC = 8:00 AM Chile (UTC-3)

2. El cron job se ejecutará automáticamente en Vercel

**Importante**: Vercel Cron requiere actualizar el endpoint para no necesitar API key cuando viene de Vercel. Modifica `/src/app/api/notificaciones/contratos-vencer/route.ts`:

```typescript
// Verificar si viene de Vercel Cron
const isVercelCron = request.headers.get('x-vercel-cron') === '1'

if (!isVercelCron) {
  // Solo verificar API key si NO es Vercel Cron
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== expectedApiKey) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
```

---

## 🔐 Seguridad

### API Key

El endpoint está protegido con API Key para evitar acceso no autorizado.

**Variables de entorno en `.env.local`:**
```bash
CRON_API_KEY=tecnycon-cron-secret-2025
NEXT_PUBLIC_CRON_API_KEY=tecnycon-cron-secret-2025
```

⚠️ **IMPORTANTE**: En producción, cambia `tecnycon-cron-secret-2025` por un valor secreto único y seguro.

**Generar API Key segura:**
```bash
openssl rand -base64 32
```

---

## 📧 Plantilla de Email

Los emails enviados incluyen:

- ✅ **Asunto**: ⚠️ Contratos por vencer en 7 días - [Nombre Obra]
- ✅ **Destinatario**: Profesional encargado de la obra
- ✅ **Contenido**:
  - Tabla con trabajadores afectados
  - Número de contrato
  - Fecha de vencimiento
  - Días restantes
  - Mensaje de acción requerida

### Ejemplo de email:

```
⚠️ Alerta de Vencimiento de Contratos
Obra: Construcción Edificio Los Almendros

Hola Juan Pérez,

Te informamos que los siguientes contratos de trabajadores
en la obra Construcción Edificio Los Almendros vencerán en 7 días:

┌──────────────────┬────────────┬─────────────┬──────────┐
│ Trabajador       │ Contrato   │ Vencimiento │ Días     │
├──────────────────┼────────────┼─────────────┼──────────┤
│ Pedro González   │ C-2024-123 │ 30/10/2025  │ 7 días   │
│ María López      │ C-2024-124 │ 30/10/2025  │ 7 días   │
└──────────────────┴────────────┴─────────────┴──────────┘

⚠️ Acción Requerida:
Por favor, coordina con el área de Recursos Humanos para
generar los anexos de plazo correspondientes.
```

---

## 🧪 Testing

### Probar el endpoint manualmente:

```bash
curl -X POST http://localhost:3002/api/notificaciones/contratos-vencer \
  -H "x-api-key: tecnycon-cron-secret-2025"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "mensaje": "Notificaciones enviadas exitosamente",
  "notificacionesEnviadas": 3,
  "errores": null
}
```

**Sin contratos por vencer:**
```json
{
  "success": true,
  "mensaje": "Notificaciones enviadas exitosamente",
  "notificacionesEnviadas": 0
}
```

---

## 🐛 Troubleshooting

### No se envían notificaciones

1. **Verificar que existan contratos que vencen en exactamente 7 días**
   - Ir a Gestión Documental
   - Filtrar por "Por vencer"
   - Verificar que haya contratos con 7 días restantes

2. **Verificar que las obras tengan profesional encargado**
   - Ir a Obras
   - Cada obra debe tener un "Profesional Encargado" asignado
   - El profesional debe tener email configurado

3. **Verificar configuración de Resend**
   - `RESEND_API_KEY` debe estar configurada en `.env.local`
   - `EMAIL_FROM` debe ser un email verificado en Resend

4. **Ver logs del servidor**
   - Revisar la consola de Next.js
   - Buscar mensajes que empiecen con 🔔, ✅, ❌

### Email no llega

1. **Verificar spam**
   - Revisar carpeta de spam/correo no deseado

2. **Verificar dominio en Resend**
   - El dominio del `EMAIL_FROM` debe estar verificado en Resend
   - Ir a https://resend.com/domains

3. **Verificar límites de Resend**
   - Plan gratuito: 100 emails/día
   - Si se excede, los emails no se enviarán

---

## 📊 Monitoreo

### Ver historial de notificaciones:

```bash
# Ver logs del cron job
grep "Iniciando verificación" /var/log/cron.log

# Ver notificaciones enviadas
grep "Notificación enviada" /var/log/cron.log
```

### Estadísticas en Resend:

1. Ir a https://resend.com/emails
2. Ver emails enviados, abiertos, clickeados
3. Ver errores de envío

---

## ✅ Checklist de Implementación

- [ ] Configurar variables de entorno (`RESEND_API_KEY`, `EMAIL_FROM`, `CRON_API_KEY`)
- [ ] Verificar dominio en Resend
- [ ] Asignar profesionales encargados a todas las obras
- [ ] Verificar que los profesionales tengan email configurado
- [ ] Probar envío manual desde la UI
- [ ] Configurar cron job automático (opción 1, 2 o 3)
- [ ] Verificar que lleguen los emails
- [ ] Documentar el proceso para el equipo

---

## 🔄 Futuras Mejoras

Ideas para mejorar el sistema:

- [ ] Dashboard de notificaciones enviadas
- [ ] Configurar días de alerta (7, 15, 30 días)
- [ ] Notificaciones por WhatsApp
- [ ] Registro en BD de notificaciones enviadas
- [ ] Reenvío automático si no se genera anexo
- [ ] Notificaciones a RRHH si hay múltiples vencimientos
- [ ] Reportes semanales consolidados

---

## 📞 Soporte

Si tienes problemas configurando las notificaciones automáticas:

1. Revisar este documento completo
2. Verificar logs del servidor
3. Probar el endpoint manualmente
4. Contactar al equipo de desarrollo

---

**Última actualización**: Octubre 2025

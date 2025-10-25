# Configuración de Envío de Emails con Resend

Este documento explica cómo configurar el sistema de envío de correos electrónicos para notificar a los usuarios cuando sus solicitudes de acceso son aprobadas o rechazadas.

## 📧 Servicio: Resend

Utilizamos [Resend](https://resend.com) como servicio de envío de emails por las siguientes razones:

- ✅ **Fácil configuración**: API simple y directa
- ✅ **Plan gratuito generoso**: 100 emails/día, 3,000 emails/mes
- ✅ **Excelente deliverability**: Alta tasa de entrega
- ✅ **Templates HTML**: Soporte completo para emails con diseño
- ✅ **Verificación de dominio**: Autenticación SPF, DKIM, DMARC

## 🚀 Configuración Paso a Paso

### 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Confirma tu email

### 2. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre (ej: "TECNYCON Producción")
4. Selecciona los permisos: **Sending access**
5. Copia la API key (solo se muestra una vez)

### 3. Configurar variables de entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```bash
# Email Config (Resend)
RESEND_API_KEY=re_123abc456def789ghi  # Tu API key de Resend
EMAIL_FROM=noreply@tecnycon.cl         # Email desde el cual se enviarán
```

### 4. Verificar dominio (Recomendado para Producción)

**Para desarrollo**: Puedes usar `onboarding@resend.dev` (no requiere verificación)

**Para producción**: Debes verificar tu dominio propio:

1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio: `tecnycon.cl`
4. Resend te dará registros DNS que debes agregar:
   - **SPF Record**: Para autenticación
   - **DKIM Record**: Para firma digital
   - **DMARC Record**: Para política de seguridad
5. Agrega estos registros en tu proveedor de DNS
6. Espera a que se verifiquen (puede tomar hasta 48 horas)

### 5. Reiniciar servidor de desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Iniciar nuevamente
npm run dev
```

## 📨 Emails que se Envían

### Email de Solicitud Aprobada

Se envía cuando un administrador aprueba una solicitud de acceso.

**Contiene**:
- ✅ Confirmación de aprobación
- 👤 Nombre de usuario
- 🔑 Contraseña temporal
- 📝 Mensaje personalizado del admin (opcional)
- 🔗 Botón para iniciar sesión

**Asunto**: "✅ Tu solicitud de acceso ha sido aprobada - TECNYCON"

### Email de Solicitud Rechazada

Se envía cuando un administrador rechaza una solicitud de acceso.

**Contiene**:
- ❌ Notificación de rechazo
- 📝 Mensaje explicativo del admin (opcional)
- ℹ️ Información de contacto

**Asunto**: "Actualización sobre tu solicitud de acceso - TECNYCON"

## 🎨 Personalización de Templates

Los templates de email están en: `/src/services/email.ts`

Puedes personalizar:
- **Colores**: Cambiar `#0066cc` por el color de tu marca
- **Logo**: Agregar imagen del logo de la empresa
- **Textos**: Modificar mensajes y descripciones
- **Estilos**: Ajustar fonts, tamaños, espaciados

## 🧪 Probar en Desarrollo

### Opción 1: Usar email de prueba de Resend

```bash
# En .env.local
EMAIL_FROM=onboarding@resend.dev
```

Los emails se enviarán normalmente pero desde el dominio de Resend.

### Opción 2: Ver logs en consola

Si no tienes `RESEND_API_KEY` configurada, los errores aparecerán en consola pero el sistema seguirá funcionando (la aprobación/rechazo se completará igual).

## 📊 Monitoreo

### Ver logs de emails enviados

Los logs aparecen en:
- **Consola del servidor**: Mensajes con ✅ o ⚠️
- **Dashboard de Resend**: Todos los emails enviados, abiertos, etc.

### Mensajes de log

```
✅ Email de aprobación enviado a: usuario@tecnycon.cl
⚠️ Error enviando email de aprobación: [error]
```

## ⚠️ Manejo de Errores

El sistema está diseñado para **no fallar** si hay un error al enviar emails:

- ✅ La solicitud se aprueba/rechaza **incluso si el email falla**
- ⚠️ El error se registra en consola
- 👤 El usuario puede ver su estado en el sistema

## 🔒 Seguridad

### Buenas prácticas:

1. **No compartas tu API key**: Guárdala en `.env.local` (no en git)
2. **Usa diferentes keys**: Una para desarrollo, otra para producción
3. **Verifica dominio en producción**: Mejora deliverability y seguridad
4. **Configura DMARC**: Protege contra spoofing
5. **Monitorea uso**: Revisa el dashboard de Resend regularmente

## 📈 Límites

### Plan Gratuito de Resend:
- 100 emails por día
- 3,000 emails por mes
- 1 dominio verificado
- Acceso completo a API

### Si necesitas más:
- **Plan Pro**: $20/mes - 50,000 emails/mes
- **Plan Business**: Personalizado

## 🆘 Troubleshooting

### Los emails no llegan

1. **Verifica API key**: Asegúrate que `RESEND_API_KEY` esté configurada
2. **Revisa logs**: Busca mensajes de error en consola
3. **Spam folder**: Revisa la carpeta de spam
4. **Dominio verificado**: En producción, verifica tu dominio
5. **Dashboard Resend**: Revisa el estado en el dashboard

### Error: "API key is invalid"

```bash
# Regenera la API key en Resend y actualiza .env.local
RESEND_API_KEY=nueva_key_aqui
```

### Email desde dominio no verificado

En desarrollo, usa:
```bash
EMAIL_FROM=onboarding@resend.dev
```

En producción, verifica tu dominio en Resend.

## 📚 Recursos

- [Documentación de Resend](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/dashboard)
- [Verificación de Dominio](https://resend.com/docs/send-with-nextjs)
- [API Reference](https://resend.com/docs/api-reference/introduction)

## 🎯 Próximos Pasos

1. ✅ Configurar API key de Resend
2. ✅ Probar envío de emails en desarrollo
3. 📧 Verificar dominio para producción
4. 🎨 Personalizar templates con branding de TECNYCON
5. 📊 Monitorear deliverability en producción

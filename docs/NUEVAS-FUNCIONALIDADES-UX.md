# 🎯 Nuevas Funcionalidades UX - TECNYCON Intranet

Este documento describe las 5 mejoras UX implementadas en la aplicación.

---

## 📋 Tabla de Contenidos

1. [Búsqueda Global](#1-búsqueda-global)
2. [Breadcrumbs Dinámicos](#2-breadcrumbs-dinámicos)
3. [Centro de Notificaciones](#3-centro-de-notificaciones)
4. [Validación en Tiempo Real](#4-validación-en-tiempo-real)
5. [Preview de Documentos](#5-preview-de-documentos)

---

## 1. Búsqueda Global

### Descripción
Sistema de búsqueda unificada que permite buscar en trabajadores, obras, documentos y contratos desde cualquier parte de la aplicación.

### Características
- ✅ Búsqueda en tiempo real (con debounce de 300ms)
- ✅ Resultados agrupados por categoría
- ✅ Navegación con teclado (↑ ↓ Enter Esc)
- ✅ Atajo de teclado **Ctrl+K** o **Cmd+K**
- ✅ Historial de búsquedas recientes
- ✅ Highlight de coincidencias
- ✅ Respeta permisos y obras asignadas

### Cómo usar

**Abrir búsqueda:**
- Click en el campo de búsqueda del Header
- Presionar **Ctrl+K** (Windows/Linux) o **Cmd+K** (Mac)

**Buscar:**
1. Escribir al menos 2 caracteres
2. Los resultados aparecen agrupados por tipo
3. Usar flechas ↑ ↓ para navegar
4. Presionar **Enter** para ir al resultado
5. Presionar **Esc** para cerrar

**Búsquedas recientes:**
- Se guardan automáticamente las últimas 5 búsquedas
- Aparecen al abrir el modal sin escribir
- Click para repetir búsqueda
- "Limpiar historial" para borrar

### Ubicación en el código
- **Componente:** `src/components/BusquedaGlobal.tsx`
- **Servicio:** `src/services/busqueda.ts`
- **Integración:** `src/components/Header.tsx`

---

## 2. Breadcrumbs Dinámicos

### Descripción
Navegación jerárquica que muestra la ruta actual y permite navegar hacia atrás fácilmente.

### Características
- ✅ Generación automática desde el pathname
- ✅ Nombres personalizados para rutas conocidas
- ✅ Consulta a BD para rutas dinámicas (ej: nombres de trabajadores/obras)
- ✅ Clickeable para navegar
- ✅ Sticky en scroll

### Ejemplo visual
```
Dashboard > Trabajadores > Juan Pérez > Documentos
  ↑         ↑              ↑            ↑
  link      link           link         actual (no link)
```

### Rutas soportadas
- Dashboard
- Trabajadores
- Obras
- Recursos Humanos
- Configuración
- Y todas las rutas definidas en `breadcrumbsConfig`

### Ubicación en el código
- **Componente:** `src/components/Breadcrumbs.tsx`
- **Configuración:** `src/lib/breadcrumbsConfig.ts`
- **Integración:** `src/app/(dashboard)/layout.tsx`

---

## 3. Centro de Notificaciones

### Descripción
Sistema completo de notificaciones en la aplicación con persistencia en base de datos.

### Características
- ✅ Badge con contador de no leídas
- ✅ Panel dropdown al hacer click en campana
- ✅ Notificaciones agrupadas por tipo
- ✅ Marcar como leída al hacer click
- ✅ "Marcar todas como leídas"
- ✅ Eliminar notificaciones individuales
- ✅ Actualización automática cada 60 segundos
- ✅ Tiempo transcurrido humanizado

### Tipos de notificaciones
- **contrato_por_vencer**: Contratos que vencen en 7 días
- **documento_vencido**: Documentos que ya vencieron
- **solicitud_acceso_pendiente**: Nuevas solicitudes de registro
- **asistencia_pendiente**: Asistencia sin registrar
- **trabajador_asignado_obra**: Cambios en asignaciones

### Cómo usar

**Ver notificaciones:**
1. Click en la campana (🔔) en el Header
2. Se abre panel con últimas 20 notificaciones
3. Badge rojo muestra cantidad no leídas

**Marcar como leída:**
- Click en la notificación → marca como leída y navega al link
- O usar botón "Marcar todas" para marcar todas

**Eliminar:**
- Hover sobre notificación → aparece icono de eliminar
- Click en icono de basurero

### Ubicación en el código
- **Componente:** `src/components/NotificacionesPanel.tsx`
- **Servicio:** `src/services/notificaciones.ts` (ampliado)
- **Migración BD:** `supabase/migrations/notificaciones_sistema.sql`
- **Integración:** `src/components/Header.tsx`

### Base de datos

**Tabla:** `notificaciones`
```sql
CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  tipo VARCHAR(50),
  titulo VARCHAR(200),
  mensaje TEXT,
  link VARCHAR(500),
  leida BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Funciones útiles:**
- `crear_notificacion(usuario_id, tipo, titulo, ...)`
- `marcar_notificacion_leida(notificacion_id)`
- `marcar_todas_leidas(usuario_id)`

### API del servicio

```typescript
// Obtener notificaciones
const notifs = await notificacionesService.getNotificacionesUsuario(usuarioId, 20)

// Contar no leídas
const conteo = await notificacionesService.contarNoLeidas(usuarioId)

// Crear notificación
await notificacionesService.crearNotificacion({
  usuario_id: 1,
  tipo: 'contrato_por_vencer',
  titulo: 'Contrato por vencer',
  mensaje: 'El contrato de Juan Pérez vence en 7 días',
  link: '/trabajadores/123',
  metadata: { trabajador_id: 123 }
})

// Marcar como leída
await notificacionesService.marcarComoLeida(notificacionId)

// Marcar todas como leídas
await notificacionesService.marcarTodasComoLeidas(usuarioId)
```

---

## 4. Validación en Tiempo Real

### Descripción
Sistema de validación de formularios con feedback visual instantáneo mientras el usuario escribe.

### Características
- ✅ Validación mientras el usuario escribe
- ✅ Mensajes de error descriptivos
- ✅ Iconos visuales (✓ error, ✓ success)
- ✅ Auto-formateo de campos (RUT, teléfono, salario)
- ✅ Hook personalizado `useFormValidation`
- ✅ Helpers de validación reutilizables

### Validaciones implementadas

**RUT chileno:**
- Formato automático: `12.345.678-9`
- Validación de dígito verificador
- Mensaje: "RUT inválido"

**Email:**
- Formato correcto
- Dominio `@tecnycon.cl` (en registro)
- Mensaje: "Email inválido"

**Contraseña:**
- Mínimo 8 caracteres
- Barra de fuerza (débil/media/fuerte)
- Requisitos: mayúscula, minúscula, número
- Mensajes específicos por requisito

**Teléfono:**
- Auto-formatear: `+56 9 1234 5678`
- Validar 8 o 9 dígitos
- Mensaje: "Teléfono inválido"

**Salario:**
- Auto-formatear: `$1.234.567`
- Solo números
- Mensaje: "Debe ser un número positivo"

### Cómo usar

**Opción 1: Hook useFormValidation**

```typescript
import { useFormValidation, validaciones } from '@/hooks/useFormValidation'
import { validarRut, formatearRut } from '@/lib/validaciones'

const schema = {
  rut: {
    validaciones: [
      validaciones.requerido('El RUT es requerido'),
      validaciones.custom(validarRut, 'RUT inválido')
    ],
    formatear: formatearRut
  },
  email: {
    validaciones: [
      validaciones.requerido(),
      validaciones.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido')
    ]
  },
  password: {
    validaciones: [
      validaciones.requerido(),
      validaciones.minLength(8, 'Mínimo 8 caracteres')
    ]
  }
}

const {
  values,
  errors,
  touched,
  isValid,
  handleChange,
  handleBlur,
  validateForm
} = useFormValidation({ rut: '', email: '', password: '' }, schema)

// En el JSX:
<Input
  value={values.rut}
  onChange={handleChange('rut')}
  onBlur={handleBlur('rut')}
/>
{touched.rut && errors.rut && (
  <p className="text-red-600">{errors.rut}</p>
)}
```

**Opción 2: Componente InputWithValidation**

```typescript
import { InputWithValidation } from '@/components/ui/input-with-validation'

<InputWithValidation
  label="RUT"
  value={values.rut}
  onChange={handleChange('rut')}
  onBlur={handleBlur('rut')}
  error={errors.rut}
  touched={touched.rut}
  required
  helperText="Formato: 12.345.678-9"
/>
```

### Ubicación en el código
- **Hook:** `src/hooks/useFormValidation.ts`
- **Helpers:** `src/lib/validaciones.ts`
- **Componente:** `src/components/ui/input-with-validation.tsx`

### Validaciones disponibles

```typescript
import {
  validarRut,
  formatearRut,
  validarEmail,
  validarEmailTecnycon,
  validarTelefono,
  formatearTelefono,
  validarPassword,
  formatearSalario,
  parsearSalario,
  validarNumeroPositivo,
  validarFecha,
  validarFechaFutura,
  validarFechaPasada,
  validarRangoFechas,
  validarURL,
  validarCuentaBancaria
} from '@/lib/validaciones'
```

---

## 5. Preview de Documentos

### Descripción
Visor integrado de documentos PDF e imágenes sin necesidad de descargar.

### Características
- ✅ Viewer de PDF con controles completos
- ✅ Zoom in/out
- ✅ Navegación por páginas
- ✅ Rotate
- ✅ Descargar
- ✅ Imprimir
- ✅ Fullscreen
- ✅ Soporte para imágenes (JPG, PNG)
- ✅ Lazy load de PDFs

### Cómo usar

**En código:**

```typescript
import DocumentViewer from '@/components/DocumentViewer'

const [viewerOpen, setViewerOpen] = useState(false)
const [currentDoc, setCurrentDoc] = useState<{url: string, name: string} | null>(null)

// Abrir viewer
const handleViewDocument = (url: string, name: string) => {
  setCurrentDoc({ url, name })
  setViewerOpen(true)
}

// En el JSX
<DocumentViewer
  open={viewerOpen}
  onOpenChange={setViewerOpen}
  fileUrl={currentDoc?.url || ''}
  fileName={currentDoc?.name}
  fileType="pdf" // o "image"
/>

// Trigger
<button onClick={() => handleViewDocument('/path/to/file.pdf', 'Contrato.pdf')}>
  Ver documento
</button>
```

**Controles del viewer:**
- **Zoom**: Botones +/- o scroll del mouse
- **Páginas**: Flechas < > o scroll
- **Rotar**: Botón de rotación
- **Descargar**: Descarga el archivo original
- **Imprimir**: Abre diálogo de impresión
- **Cerrar**: X o Esc

### Ubicación en el código
- **Componente:** `src/components/DocumentViewer.tsx`
- **Dependencias:** `@react-pdf-viewer/core`, `@react-pdf-viewer/default-layout`

### Ejemplo de integración en Tab Documentos

```typescript
// En página de trabajador/[id]
const [docViewer, setDocViewer] = useState<{open: boolean, url: string, name: string}>({
  open: false,
  url: '',
  name: ''
})

// En el listado de documentos
{documentos.map(doc => (
  <div key={doc.id}>
    <span>{doc.nombre}</span>
    <button onClick={() => setDocViewer({
      open: true,
      url: doc.archivo,
      name: doc.nombre
    })}>
      Ver
    </button>
  </div>
))}

// Al final del componente
<DocumentViewer
  open={docViewer.open}
  onOpenChange={(open) => setDocViewer(prev => ({ ...prev, open }))}
  fileUrl={docViewer.url}
  fileName={docViewer.name}
  fileType="pdf"
/>
```

---

## 🚀 Pasos Siguientes

### 1. Ejecutar migración de BD

**Opción A: Con Supabase CLI (local)**
```bash
npx supabase db push
```

**Opción B: Manualmente en Supabase Dashboard**
1. Ir a SQL Editor en Supabase
2. Copiar contenido de `supabase/migrations/notificaciones_sistema.sql`
3. Ejecutar

### 2. Instalar dependencias

```bash
npm install @react-pdf-viewer/core @react-pdf-viewer/default-layout pdfjs-dist cmdk @radix-ui/react-scroll-area
```

### 3. Probar funcionalidades

**Búsqueda Global:**
- Presionar Ctrl+K
- Buscar "juan" o "obra"
- Verificar resultados

**Breadcrumbs:**
- Navegar a cualquier ruta
- Verificar breadcrumbs en la parte superior
- Click en breadcrumb para ir atrás

**Notificaciones:**
- Crear una notificación de prueba:
```sql
SELECT crear_notificacion(
  1, -- usuario_id
  'contrato_por_vencer',
  'Contrato por vencer - Prueba',
  'Este es un mensaje de prueba',
  '/trabajadores/1',
  '{}'::jsonb
);
```
- Click en campana del Header
- Verificar que aparece

**Validación:**
- Ir a formulario de login o crear trabajador
- Escribir RUT inválido
- Verificar mensaje de error en tiempo real

**Preview PDF:**
- Ir a documentos de un trabajador
- Click en "Ver" en un PDF
- Verificar que abre el viewer

---

## 📚 Documentación adicional

- [Configuración de búsqueda](./src/services/busqueda.ts)
- [Helpers de validación](./src/lib/validaciones.ts)
- [Sistema de notificaciones](./src/services/notificaciones.ts)
- [Breadcrumbs config](./src/lib/breadcrumbsConfig.ts)

---

## 🐛 Troubleshooting

### La búsqueda no encuentra resultados
- Verificar que hay datos en la BD
- Revisar permisos del usuario
- Verificar obras asignadas

### Notificaciones no aparecen
- Verificar que se ejecutó la migración de BD
- Crear notificación de prueba con SQL
- Revisar consola por errores

### PDF no se visualiza
- Verificar que el worker de PDF.js está cargando correctamente
- URL del worker: `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`
- Verificar que el archivo existe y es accesible

### Validaciones no funcionan
- Verificar que el hook `useFormValidation` está correctamente configurado
- Revisar el schema de validaciones
- Asegurarse de usar `handleChange` y `handleBlur`

---

**Fecha de implementación:** 25 de Octubre, 2025
**Versión:** 1.1.0

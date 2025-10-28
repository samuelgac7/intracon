/**
 * Helpers de validación para formularios
 */

// Validar RUT chileno
export const validarRut = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') return false

  // Limpiar RUT de puntos y guión
  const rutLimpio = rut.replace(/[.-]/g, '').trim()

  // Debe tener al menos 2 caracteres (número + dígito verificador)
  if (rutLimpio.length < 2) return false

  // Separar número del dígito verificador
  const numero = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toUpperCase()

  // Validar que el número sea numérico
  if (!/^\d+$/.test(numero)) return false

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const dvEsperado = 11 - (suma % 11)
  let dvCalculado: string

  if (dvEsperado === 11) {
    dvCalculado = '0'
  } else if (dvEsperado === 10) {
    dvCalculado = 'K'
  } else {
    dvCalculado = dvEsperado.toString()
  }

  return dv === dvCalculado
}

// Formatear RUT (12345678-9 → 12.345.678-9)
export const formatearRut = (rut: string): string => {
  if (!rut) return ''

  // Limpiar RUT de caracteres no numéricos excepto K
  const rutLimpio = rut.replace(/[^0-9kK]/g, '').toUpperCase()

  if (rutLimpio.length <= 1) return rutLimpio

  // Separar número del dígito verificador
  const numero = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  // Formatear número con puntos
  const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${numeroFormateado}-${dv}`
}

// Validar email
export const validarEmail = (email: string): boolean => {
  if (!email) return false

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

// Validar email dominio @tecnycon.cl
export const validarEmailTecnycon = (email: string): boolean => {
  if (!email) return false

  const emailRegex = /^[a-zA-Z0-9._%+-]+@tecnycon\.cl$/i
  return emailRegex.test(email.trim())
}

// Validar teléfono chileno
export const validarTelefono = (telefono: string): boolean => {
  if (!telefono) return false

  // Limpiar teléfono de caracteres especiales
  const telefonoLimpio = telefono.replace(/[^\d]/g, '')

  // Debe tener 9 dígitos (celular) u 8 (fijo)
  // Celular comienza con 9
  if (telefonoLimpio.length === 9 && telefonoLimpio[0] === '9') {
    return true
  }

  // Fijo tiene 8 dígitos
  if (telefonoLimpio.length === 8) {
    return true
  }

  return false
}

// Formatear teléfono chileno (+56 9 1234 5678)
export const formatearTelefono = (telefono: string): string => {
  if (!telefono) return ''

  // Limpiar teléfono de caracteres especiales
  const telefonoLimpio = telefono.replace(/[^\d]/g, '')

  if (telefonoLimpio.length === 0) return ''

  // Celular (9 dígitos)
  if (telefonoLimpio.length === 9 && telefonoLimpio[0] === '9') {
    return `+56 ${telefonoLimpio[0]} ${telefonoLimpio.slice(1, 5)} ${telefonoLimpio.slice(5)}`
  }

  // Fijo (8 dígitos)
  if (telefonoLimpio.length === 8) {
    return `+56 ${telefonoLimpio.slice(0, 1)} ${telefonoLimpio.slice(1, 5)} ${telefonoLimpio.slice(5)}`
  }

  // Si no cumple formato, devolver sin formatear
  return telefonoLimpio
}

// Validar contraseña segura
export interface ValidacionPassword {
  esValida: boolean
  errores: string[]
  fuerza: 'debil' | 'media' | 'fuerte'
}

export const validarPassword = (password: string): ValidacionPassword => {
  const errores: string[] = []

  if (!password) {
    return {
      esValida: false,
      errores: ['La contraseña es requerida'],
      fuerza: 'debil'
    }
  }

  // Longitud mínima 8 caracteres
  if (password.length < 8) {
    errores.push('Debe tener al menos 8 caracteres')
  }

  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    errores.push('Debe contener al menos una mayúscula')
  }

  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    errores.push('Debe contener al menos una minúscula')
  }

  // Al menos un número
  if (!/\d/.test(password)) {
    errores.push('Debe contener al menos un número')
  }

  // Calcular fuerza
  let fuerza: 'debil' | 'media' | 'fuerte' = 'debil'

  if (errores.length === 0) {
    // Caracteres especiales
    const tieneEspeciales = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    if (password.length >= 12 && tieneEspeciales) {
      fuerza = 'fuerte'
    } else if (password.length >= 8) {
      fuerza = 'media'
    }
  }

  return {
    esValida: errores.length === 0,
    errores,
    fuerza
  }
}

// Formatear salario ($1.234.567)
export const formatearSalario = (valor: number | string): string => {
  if (!valor && valor !== 0) return ''

  const numero = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d]/g, '')) : valor

  if (isNaN(numero)) return ''

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numero)
}

// Parsear salario formateado a número
export const parsearSalario = (salario: string): number => {
  if (!salario) return 0

  // Remover todo excepto números
  const numeroLimpio = salario.replace(/[^\d]/g, '')

  return parseInt(numeroLimpio) || 0
}

// Validar número positivo
export const validarNumeroPositivo = (valor: string | number): boolean => {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor
  return !isNaN(numero) && numero > 0
}

// Validar fecha válida
export const validarFecha = (fecha: string): boolean => {
  if (!fecha) return false

  const date = new Date(fecha)
  return date instanceof Date && !isNaN(date.getTime())
}

// Validar fecha futura
export const validarFechaFutura = (fecha: string): boolean => {
  if (!validarFecha(fecha)) return false

  const date = new Date(fecha)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  return date >= hoy
}

// Validar fecha pasada
export const validarFechaPasada = (fecha: string): boolean => {
  if (!validarFecha(fecha)) return false

  const date = new Date(fecha)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  return date <= hoy
}

// Validar rango de fechas
export const validarRangoFechas = (fechaInicio: string, fechaFin: string): boolean => {
  if (!validarFecha(fechaInicio) || !validarFecha(fechaFin)) return false

  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)

  return inicio <= fin
}

// Validar URL
export const validarURL = (url: string): boolean => {
  if (!url) return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Validar cuenta bancaria (depende del tipo)
export const validarCuentaBancaria = (numero: string, tipoCuenta: 'corriente' | 'vista' | 'rut'): boolean => {
  if (!numero) return false

  // Remover espacios y guiones
  const numeroLimpio = numero.replace(/[\s-]/g, '')

  // Validar que sean solo números
  if (!/^\d+$/.test(numeroLimpio)) return false

  // Cuenta RUT (igual que RUT)
  if (tipoCuenta === 'rut') {
    return validarRut(numero)
  }

  // Cuenta corriente y vista (mínimo 8 dígitos)
  if (tipoCuenta === 'corriente' || tipoCuenta === 'vista') {
    return numeroLimpio.length >= 8 && numeroLimpio.length <= 20
  }

  return false
}

// Mensajes de error comunes
export const MENSAJES_ERROR = {
  requerido: 'Este campo es requerido',
  rutInvalido: 'RUT inválido. Verifica el dígito verificador',
  emailInvalido: 'Email inválido',
  emailDominioInvalido: 'Debe ser un correo @tecnycon.cl',
  telefonoInvalido: 'Teléfono inválido. Debe tener 8 o 9 dígitos',
  passwordDebil: 'La contraseña es muy débil',
  passwordNoCoincide: 'Las contraseñas no coinciden',
  numeroInvalido: 'Debe ser un número válido',
  numeroPositivo: 'Debe ser un número positivo',
  fechaInvalida: 'Fecha inválida',
  fechaFuturaInvalida: 'La fecha debe ser futura',
  fechaPasadaInvalida: 'La fecha debe ser pasada',
  rangoFechasInvalido: 'La fecha de inicio debe ser anterior a la fecha de fin',
  urlInvalida: 'URL inválida',
  cuentaBancariaInvalida: 'Número de cuenta inválido'
}

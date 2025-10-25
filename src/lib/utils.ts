import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Limpia el RUT dejando solo números y dígito verificador
 */
export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

/**
 * Formatea el RUT al formato chileno: XX.XXX.XXX-X
 */
export function formatearRut(rut: string): string {
  const rutLimpio = limpiarRut(rut)

  if (rutLimpio.length === 0) return ''

  // Separar cuerpo y dígito verificador
  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  // Formatear cuerpo con puntos
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Retornar con guión si hay dígito verificador
  if (dv) {
    return `${cuerpoFormateado}-${dv}`
  }

  return cuerpoFormateado
}

/**
 * Valida si un RUT chileno es válido usando el algoritmo de módulo 11
 */
export function validarRut(rut: string): boolean {
  const rutLimpio = limpiarRut(rut)

  if (rutLimpio.length < 2) return false

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const dvCalculado = 11 - (suma % 11)
  const dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString()

  return dv === dvEsperado
}

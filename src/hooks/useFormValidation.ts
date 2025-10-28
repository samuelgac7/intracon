import { useState, useCallback } from 'react'

export type ValidacionRegla<T = unknown> = (valor: unknown, valores?: T) => string | null

export interface CampoConfig<T = unknown> {
  validaciones?: ValidacionRegla<T>[]
  formatear?: (valor: string) => string
  transformar?: (valor: string) => unknown
}

export interface SchemaValidacion<T = unknown> {
  [campo: string]: CampoConfig<T>
}

interface UseFormValidationReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  setValue: (campo: keyof T, valor: unknown) => void
  setValues: (nuevosValores: Partial<T>) => void
  setError: (campo: keyof T, error: string | null) => void
  setTouched: (campo: keyof T, touched: boolean) => void
  handleChange: (campo: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (campo: keyof T) => () => void
  validateField: (campo: keyof T) => boolean
  validateForm: () => boolean
  reset: () => void
}

export function useFormValidation<T extends Record<string, unknown>>(
  valoresIniciales: T,
  schema: SchemaValidacion<T> = {}
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(valoresIniciales)
  const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({})

  // Validar un campo específico
  const validateField = useCallback((campo: keyof T): boolean => {
    const config = schema[campo as string]
    if (!config || !config.validaciones) return true

    const valor = values[campo]

    for (const validacion of config.validaciones) {
      const error = validacion(valor, values)
      if (error) {
        setErrorsState(prev => ({ ...prev, [campo]: error }))
        return false
      }
    }

    // Limpiar error si pasa validaciones
    setErrorsState(prev => {
      const nuevoErrors = { ...prev }
      delete nuevoErrors[campo]
      return nuevoErrors
    })

    return true
  }, [values, schema])

  // Validar todo el formulario
  const validateForm = useCallback((): boolean => {
    let esValido = true
    const nuevosErrores: Partial<Record<keyof T, string>> = {}

    for (const campo in schema) {
      const config = schema[campo]
      if (!config.validaciones) continue

      const valor = values[campo as keyof T]

      for (const validacion of config.validaciones) {
        const error = validacion(valor, values)
        if (error) {
          nuevosErrores[campo as keyof T] = error
          esValido = false
          break
        }
      }
    }

    setErrorsState(nuevosErrores)
    return esValido
  }, [values, schema])

  // Establecer valor de un campo
  const setValue = useCallback((campo: keyof T, valor: unknown) => {
    setValuesState(prev => {
      const config = schema[campo as string]

      // Aplicar transformación si existe
      let valorFinal = valor
      if (config?.transformar) {
        valorFinal = config.transformar(valor as string)
      }

      return { ...prev, [campo]: valorFinal }
    })

    // Validar campo si ya fue tocado
    if (touched[campo]) {
      setTimeout(() => validateField(campo), 0)
    }
  }, [schema, touched, validateField])

  // Establecer múltiples valores
  const setValues = useCallback((nuevosValores: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...nuevosValores }))
  }, [])

  // Establecer error manual
  const setError = useCallback((campo: keyof T, error: string | null) => {
    if (error === null) {
      setErrorsState(prev => {
        const nuevoErrors = { ...prev }
        delete nuevoErrors[campo]
        return nuevoErrors
      })
    } else {
      setErrorsState(prev => ({ ...prev, [campo]: error }))
    }
  }, [])

  // Establecer touched
  const setTouched = useCallback((campo: keyof T, value: boolean) => {
    setTouchedState(prev => ({ ...prev, [campo]: value }))
  }, [])

  // Manejar cambio de input
  const handleChange = useCallback((campo: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const config = schema[campo as string]
      let valor: string = e.target.value

      // Aplicar formateo si existe
      if (config?.formatear) {
        valor = config.formatear(valor as string)
      }

      setValue(campo, valor)
    }
  }, [schema, setValue])

  // Manejar blur de input
  const handleBlur = useCallback((campo: keyof T) => {
    return () => {
      setTouched(campo, true)
      validateField(campo)
    }
  }, [setTouched, validateField])

  // Reset formulario
  const reset = useCallback(() => {
    setValuesState(valoresIniciales)
    setErrorsState({})
    setTouchedState({})
  }, [valoresIniciales])

  // Calcular si el formulario es válido
  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setValues,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    reset
  }
}

// Helpers para crear validaciones comunes
export const validaciones = {
  requerido: (mensaje: string = 'Este campo es requerido'): ValidacionRegla => {
    return (valor: unknown) => {
      if (valor === null || valor === undefined || valor === '') {
        return mensaje
      }
      if (typeof valor === 'string' && valor.trim() === '') {
        return mensaje
      }
      return null
    }
  },

  minLength: (min: number, mensaje?: string): ValidacionRegla => {
    return (valor: unknown) => {
      if (!valor) return null
      if (typeof valor === 'string' && valor.length < min) {
        return mensaje || `Debe tener al menos ${min} caracteres`
      }
      return null
    }
  },

  maxLength: (max: number, mensaje?: string): ValidacionRegla => {
    return (valor: unknown) => {
      if (!valor) return null
      if (typeof valor === 'string' && valor.length > max) {
        return mensaje || `Debe tener máximo ${max} caracteres`
      }
      return null
    }
  },

  pattern: (regex: RegExp, mensaje: string): ValidacionRegla => {
    return (valor: unknown) => {
      if (!valor) return null
      if (typeof valor === 'string' && !regex.test(valor)) {
        return mensaje
      }
      return null
    }
  },

  custom: <T = unknown>(fn: (valor: unknown, valores?: T) => boolean, mensaje: string): ValidacionRegla<T> => {
    return (valor: unknown, valores?: T) => {
      if (!fn(valor, valores)) {
        return mensaje
      }
      return null
    }
  },

  coincide: <T extends Record<string, unknown> = Record<string, unknown>>(otroCampo: string, mensaje: string = 'Los campos no coinciden'): ValidacionRegla<T> => {
    return (valor: unknown, valores?: T) => {
      if (!valores) return null
      if (valor !== (valores as Record<string, unknown>)[otroCampo]) {
        return mensaje
      }
      return null
    }
  }
}

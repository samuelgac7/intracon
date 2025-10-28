import * as React from "react"
import { Input } from "./input"
import { Label } from "./label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputWithValidationProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
  touched?: boolean
  success?: boolean
  helperText?: string
  required?: boolean
  containerClassName?: string
}

const InputWithValidation = React.forwardRef<HTMLInputElement, InputWithValidationProps>(
  ({
    label,
    error,
    touched,
    success,
    helperText,
    required,
    containerClassName,
    className,
    id,
    ...props
  }, ref) => {
    const hasError = touched && error
    const showSuccess = touched && success && !error
    const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {/* Label */}
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        {/* Input container */}
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              className,
              hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              showSuccess && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
            )}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={
              hasError ? `${inputId}-error` :
              helperText ? `${inputId}-helper` :
              undefined
            }
            {...props}
          />

          {/* Icono de validación */}
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}

          {showSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>

        {/* Mensajes de ayuda/error */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-600 flex items-center gap-1 animate-in fade-in slide-in-from-top-1"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

InputWithValidation.displayName = "InputWithValidation"

export { InputWithValidation }

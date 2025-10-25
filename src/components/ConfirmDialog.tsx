"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  warningMessage?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "default" | "destructive" | "warning"
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warningMessage,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default"
}: ConfirmDialogProps) {
  const getButtonStyle = () => {
    if (variant === "destructive") return "bg-red-600 hover:bg-red-700 text-white"
    if (variant === "warning") return "bg-orange-600 hover:bg-orange-700 text-white"
    return "text-white"
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {variant === "warning" && (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            {variant === "destructive" && (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {warningMessage && (
          <div className={`p-4 rounded-lg border ${
            variant === "destructive"
              ? "bg-red-50 border-red-200"
              : "bg-orange-50 border-orange-200"
          }`}>
            <p className={`text-sm font-medium ${
              variant === "destructive" ? "text-red-900" : "text-orange-900"
            }`}>
              ⚠️ {warningMessage}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={getButtonStyle()}
            style={variant === "default" ? { backgroundColor: '#0066cc' } : undefined}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
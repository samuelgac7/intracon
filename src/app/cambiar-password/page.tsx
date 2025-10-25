"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import * as usuariosService from "@/services/usuarios"
import bcrypt from 'bcryptjs'

export default function CambiarPasswordPage() {
  const router = useRouter()
  const { sesion, updateMustChangePassword } = useAuth()
  const [passwordActual, setPasswordActual] = useState("")
  const [passwordNueva, setPasswordNueva] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!sesion) {
    router.push('/login')
    return null
  }

  const validarPassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres"
    }
    if (!/[A-Z]/.test(pass)) {
      return "Debe incluir al menos una letra mayúscula"
    }
    if (!/[a-z]/.test(pass)) {
      return "Debe incluir al menos una letra minúscula"
    }
    if (!/[0-9]/.test(pass)) {
      return "Debe incluir al menos un número"
    }
    return null
  }

  const handleCambiar = async () => {
    setError("")
    setLoading(true)

    try {
      if (!passwordActual || !passwordNueva || !passwordConfirm) {
        setError("Todos los campos son obligatorios")
        setLoading(false)
        return
      }

      if (passwordNueva !== passwordConfirm) {
        setError("Las contraseñas nuevas no coinciden")
        setLoading(false)
        return
      }

      const errorValidacion = validarPassword(passwordNueva)
      if (errorValidacion) {
        setError(errorValidacion)
        setLoading(false)
        return
      }

      const usuario = await usuariosService.getById(sesion.usuarioId)

      if (!usuario || !usuario.credenciales) {
        setError("Error al encontrar usuario")
        setLoading(false)
        return
      }

      const esPasswordValida = await bcrypt.compare(passwordActual, usuario.credenciales.passwordHash)
      if (!esPasswordValida) {
        setError("La contraseña actual es incorrecta")
        setLoading(false)
        return
      }

      await usuariosService.changePassword(sesion.usuarioId, passwordNueva, false)
      updateMustChangePassword(false)

      alert('✅ Contraseña cambiada exitosamente')
      router.push('/dashboard')

    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setError("Error al cambiar contraseña")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: '#f8fafc' }}>
      <div className="absolute inset-0" style={{ opacity: 0.03 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230066cc' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-gray-200 animate-scale">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300" style={{ backgroundColor: '#0066cc' }}>
            <Lock className="h-12 w-12 text-white" />
          </div>

          <div>
            <CardTitle className="text-3xl font-bold gradient-text">Cambiar Contraseña</CardTitle>
            <CardDescription className="text-base mt-2 text-gray-600">
              {sesion.mustChangePassword
                ? "Por seguridad, debe cambiar su contraseña temporal"
                : "Actualice su contraseña de acceso"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="animate-slide-up">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sesion.mustChangePassword && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 animate-slide-up">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por seguridad, debe cambiar su contraseña temporal antes de continuar.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="passwordActual" className="text-gray-700 font-medium">Contraseña Actual</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
              <Input
                id="passwordActual"
                type={showPasswords ? "text" : "password"}
                placeholder="Ingrese su contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordNueva" className="text-gray-700 font-medium">Contraseña Nueva</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
              <Input
                id="passwordNueva"
                type={showPasswords ? "text" : "password"}
                placeholder="Ingrese su nueva contraseña"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm" className="text-gray-700 font-medium">Confirmar Contraseña Nueva</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
              <Input
                id="passwordConfirm"
                type={showPasswords ? "text" : "password"}
                placeholder="Confirme su nueva contraseña"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="pl-10 pr-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                tabIndex={-1}
              >
                {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="font-semibold text-blue-900 mb-2">Requisitos de contraseña:</div>
            <ul className="space-y-1.5 text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Mínimo 8 caracteres</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Al menos una mayúscula</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Al menos una minúscula</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Al menos un número</span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <div className="flex gap-3 w-full">
            {!sesion.mustChangePassword && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1 h-11 border-gray-300 hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="button"
              onClick={handleCambiar}
              className={`h-11 text-white font-medium button-hover ${!sesion.mustChangePassword ? 'flex-1' : 'w-full'}`}
              style={{ backgroundColor: '#0066cc' }}
              disabled={loading || !passwordActual || !passwordNueva || !passwordConfirm}
            >
              {loading ? (
                <>
                  <div className="spinner h-4 w-4 mr-2"></div>
                  Cambiando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            La contraseña debe cumplir con todos los requisitos de seguridad
          </p>
        </CardFooter>
      </Card>

      <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-gray-500">
        <p>© 2025 TECNYCON Constructora. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}

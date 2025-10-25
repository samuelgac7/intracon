"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Lock, User, Eye, EyeOff, AlertCircle, Mail } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import * as usuariosService from "@/services/usuarios"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Estados para registro
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerNombre, setRegisterNombre] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")

  // Validar que el email sea de dominio @tecnycon.cl
  const validateTecnyconEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@tecnycon\.cl$/i
    return emailRegex.test(email.trim())
  }

  const handleRegister = async () => {
    setError("")
    setLoading(true)

    try {
      // Validaciones
      if (!registerNombre.trim() || !registerEmail.trim() || !registerPassword || !registerConfirmPassword) {
        setError("Todos los campos son obligatorios")
        addToast({
          type: "error",
          title: "Campos incompletos",
          description: "Por favor completa todos los campos"
        })
        setLoading(false)
        return
      }

      // Validar dominio @tecnycon.cl
      if (!validateTecnyconEmail(registerEmail)) {
        setError("Solo se permiten correos @tecnycon.cl")
        addToast({
          type: "error",
          title: "Dominio no autorizado",
          description: "Solo puedes registrarte con un correo corporativo @tecnycon.cl"
        })
        setLoading(false)
        return
      }

      // Validar que las contraseñas coincidan
      if (registerPassword !== registerConfirmPassword) {
        setError("Las contraseñas no coinciden")
        addToast({
          type: "error",
          title: "Contraseñas no coinciden",
          description: "Verifica que ambas contraseñas sean iguales"
        })
        setLoading(false)
        return
      }

      // Validar longitud mínima de contraseña
      if (registerPassword.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres")
        addToast({
          type: "error",
          title: "Contraseña débil",
          description: "La contraseña debe tener al menos 8 caracteres"
        })
        setLoading(false)
        return
      }

      // Verificar si ya existe una solicitud para este email
      const solicitudesService = (await import('@/services/solicitudesAcceso')).default
      const solicitudExistente = await solicitudesService.getByEmail(registerEmail.trim().toLowerCase())

      if (solicitudExistente) {
        if (solicitudExistente.estado === 'pendiente') {
          addToast({
            type: "warning",
            title: "Solicitud ya existe",
            description: "Ya tienes una solicitud pendiente. El administrador la revisará pronto."
          })
        } else if (solicitudExistente.estado === 'rechazada') {
          addToast({
            type: "error",
            title: "Solicitud rechazada",
            description: solicitudExistente.mensaje_admin || "Tu solicitud fue rechazada anteriormente. Contacta al administrador."
          })
        } else {
          addToast({
            type: "info",
            title: "Solicitud aprobada",
            description: "Tu cuenta ya fue aprobada. Usa 'Iniciar Sesión' con tus credenciales."
          })
        }
        setLoading(false)
        return
      }

      // Crear solicitud de acceso (NO crear cuenta en Supabase Auth)
      await solicitudesService.create({
        email: registerEmail.trim().toLowerCase(),
        nombre: registerNombre.trim(),
        auth_provider: 'manual',
        mensaje_solicitud: 'Registro manual desde formulario'
      })

      addToast({
        type: "success",
        title: "¡Solicitud enviada!",
        description: "Tu solicitud será revisada por el administrador. Te notificaremos cuando sea aprobada."
      })

      // Limpiar formulario y cambiar a modo login
      setRegisterEmail("")
      setRegisterPassword("")
      setRegisterNombre("")
      setRegisterConfirmPassword("")
      setMode('login')

    } catch (err: any) {
      console.error('Error en registro:', err)
      setError(err.message || "Error al crear la solicitud")
      addToast({
        type: "error",
        title: "Error en registro",
        description: err.message || "No se pudo crear la solicitud. Intenta nuevamente."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            hd: 'tecnycon.cl' // Restringe a dominio tecnycon.cl
          }
        }
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Error en login con Google:', err)
      addToast({
        type: "error",
        title: "Error con Google",
        description: err.message || "No se pudo iniciar sesión con Google"
      })
    }
  }

  const handleLogin = async () => {
    console.log('🚀 handleLogin iniciado')
    setError("")
    setLoading(true)

    try {
      console.log('🔍 Buscando usuario:', username.toLowerCase().trim())

      // Buscar usuario por username
      console.log('📞 Llamando a usuariosService.getByUsername...')
      const usuario = await usuariosService.getByUsername(username.toLowerCase().trim())
      console.log('✅ usuariosService.getByUsername completado')

      console.log('👤 Usuario encontrado:', usuario ? 'SÍ' : 'NO')
      console.log('📊 Datos usuario:', usuario)

      if (!usuario) {
        setError("Usuario no encontrado")
        addToast({
          type: "error",
          title: "Usuario no encontrado",
          description: "Verifica tu usuario e intenta nuevamente"
        })
        setLoading(false)
        return
      }

      console.log('🔐 Tiene credenciales:', !!usuario.credenciales)
      console.log('🔑 Credenciales:', usuario.credenciales)

      if (!usuario.credenciales) {
        console.log('❌ Usuario sin credenciales')
        setError("Este usuario no tiene credenciales de acceso")
        addToast({
          type: "error",
          title: "Sin credenciales",
          description: "Este usuario no tiene credenciales configuradas"
        })
        setLoading(false)
        return
      }

      // Validar password con bcrypt
      console.log('🔓 Validando password...')
      const esPasswordValida = await usuariosService.verifyPassword(usuario.id, password)
      console.log('🔓 Password válida:', esPasswordValida)

      if (!esPasswordValida) {
        console.log('❌ Password incorrecto')
        const intentosFallidos = (usuario.credenciales.intentosFallidos || 0) + 1

        if (intentosFallidos >= 5) {
          await usuariosService.incrementFailedAttempts(usuario.id)
          setError("Cuenta bloqueada por múltiples intentos fallidos")
          addToast({
            type: "error",
            title: "Cuenta bloqueada",
            description: "Tu cuenta ha sido bloqueada. Contacta al administrador."
          })
        } else {
          await usuariosService.incrementFailedAttempts(usuario.id)
          setError(`Contraseña incorrecta. Intentos restantes: ${5 - intentosFallidos}`)
          addToast({
            type: "warning",
            title: "Contraseña incorrecta",
            description: `Te quedan ${5 - intentosFallidos} intentos`
          })
        }

        setLoading(false)
        return
      }

      // Login exitoso - actualizar último acceso
      console.log('✅ Password correcto! Actualizando último acceso...')
      await usuariosService.updateLastAccess(usuario.id)
      console.log('✅ Último acceso actualizado')

      // Guardar sesión usando el hook useAuth (reemplaza localStorage)
      console.log('💾 Guardando sesión...')
      login(usuario)
      console.log('✅ Sesión guardada en Zustand')

      // También guardar en cookie para el middleware
      const sesionData = {
        usuarioId: usuario.id,
        username: usuario.credenciales.username,
        nombre: usuario.nombre,
        rol: usuario.rol,
        cargo: usuario.cargo,
        foto: usuario.foto,
        mustChangePassword: usuario.credenciales.mustChangePassword,
        loginTime: new Date().toISOString()
      }

      // Guardar cookie que dura 8 horas (duración de sesión típica)
      document.cookie = `sesion_tecnycon=${JSON.stringify(sesionData)}; path=/; max-age=28800; SameSite=Lax`
      console.log('✅ Cookie de sesión guardada')

      addToast({
        type: "success",
        title: "¡Bienvenido!",
        description: `Inicio de sesión exitoso, ${usuario.nombre}`
      })

      console.log('🔄 Redirigiendo...')
      console.log('Must change password:', usuario.credenciales.mustChangePassword)

      if (usuario.credenciales.mustChangePassword) {
        console.log('➡️ Redirigiendo a cambiar-password')
        router.push('/cambiar-password')
      } else {
        console.log('➡️ Redirigiendo a dashboard')
        router.push('/dashboard')
      }

    } catch (err: any) {
      console.error('Error en login:', err)
      setError("Error al procesar el login")
      addToast({
        type: "error",
        title: "Error del sistema",
        description: err.message || "Ocurrió un error. Intenta nuevamente."
      })
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username && password && !loading) {
      handleLogin()
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
            <Building2 className="h-12 w-12 text-white" />
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold gradient-text">TECNYCON</CardTitle>
            <CardDescription className="text-base mt-2 text-gray-600">
              Sistema de Gestión Empresarial
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

          {mode === 'login' ? (
            <>
              {/* FORMULARIO DE LOGIN */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">Usuario</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors">
                  <input type="checkbox" className="rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]" />
                  <span>Recordarme</span>
                </label>
                <button
                  type="button"
                  className="font-medium hover:underline transition-colors"
                  style={{ color: '#0066cc' }}
                  onClick={() => addToast({
                    type: "info",
                    title: "Próximamente",
                    description: "Funcionalidad de recuperación en desarrollo"
                  })}
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
            </>
          ) : (
            <>
              {/* FORMULARIO DE REGISTRO */}
              <div className="space-y-2">
                <Label htmlFor="register-nombre" className="text-gray-700 font-medium">Nombre completo</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
                  <Input
                    id="register-nombre"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={registerNombre}
                    onChange={(e) => setRegisterNombre(e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-gray-700 font-medium">Correo corporativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="usuario@tecnycon.cl"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">Solo correos @tecnycon.cl</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-gray-700 font-medium">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password" className="text-gray-700 font-medium">Confirmar contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#0066cc]" />
                  <Input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita su contraseña"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-[#0066cc] focus:ring-[#0066cc] transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="button"
            onClick={mode === 'login' ? handleLogin : handleRegister}
            className="w-full h-11 text-white font-medium button-hover"
            style={{ backgroundColor: '#0066cc' }}
            disabled={
              loading ||
              (mode === 'login'
                ? (!username || !password)
                : (!registerNombre || !registerEmail || !registerPassword || !registerConfirmPassword)
              )
            }
          >
            {loading ? (
              <>
                <div className="spinner h-4 w-4 mr-2"></div>
                {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
              </>
            ) : (
              mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </Button>

          {/* Separador OR */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">O continuar con</span>
            </div>
          </div>

          {/* Botón Google */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-11 font-medium border-gray-300 hover:bg-gray-50 transition-all"
            disabled={loading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          {/* Toggle entre Login y Registro */}
          <div className="text-center text-sm">
            {mode === 'login' ? (
              <p className="text-gray-600">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setError("")
                  }}
                  className="font-medium hover:underline transition-colors"
                  style={{ color: '#0066cc' }}
                  disabled={loading}
                >
                  Crear cuenta
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError("")
                  }}
                  className="font-medium hover:underline transition-colors"
                  style={{ color: '#0066cc' }}
                  disabled={loading}
                >
                  Iniciar sesión
                </button>
              </p>
            )}
          </div>

          <p className="text-xs text-center text-gray-500">
            Al {mode === 'login' ? 'iniciar sesión' : 'registrarte'}, aceptas los términos y condiciones de uso
          </p>
        </CardFooter>
      </Card>

      <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-gray-500">
        <p>© 2025 TECNYCON Constructora. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
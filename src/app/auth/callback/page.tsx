"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as usuariosService from "@/services/usuarios"
import solicitudesAccesoService from "@/services/solicitudesAcceso"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🔵 Callback iniciado')
      console.log('🔵 URL completa:', window.location.href)
      console.log('🔵 Hash:', window.location.hash)

      try {
        // Obtener el hash de la URL que contiene los tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        console.log('🔵 Access token encontrado:', !!accessToken)

        if (!accessToken) {
          // Si no hay access token, intentar obtener sesión directamente
          console.log('⚠️ No hay access token en hash, intentando getSession...')
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError || !session) {
            console.error('❌ No se pudo obtener sesión:', sessionError)
            throw new Error('No se recibió token de autenticación')
          }

          console.log('✅ Sesión obtenida directamente')
          const user = session.user
          const email = user.email || ''
          console.log('📧 Email:', email)

          // Validar dominio
          const emailRegex = /^[a-zA-Z0-9._%+-]+@tecnycon\.cl$/i
          if (!emailRegex.test(email)) {
            await supabase.auth.signOut()
            setStatus('error')
            setMessage('Solo se permiten correos corporativos @tecnycon.cl')
            return
          }

          // Verificar si existe en usuarios
          console.log('🔍 Buscando usuario en tabla usuarios...')
          const usuarioExistente = await usuariosService.getByEmail(email)
          console.log('👤 Usuario existente:', !!usuarioExistente)

          if (usuarioExistente) {
            setStatus('success')
            setMessage('Autenticación exitosa. Redirigiendo...')
            setTimeout(() => router.push('/dashboard'), 1500)
            return
          }

          // Verificar solicitud existente
          console.log('🔍 Buscando solicitud de acceso...')
          const solicitudExistente = await solicitudesAccesoService.getByEmail(email)
          console.log('📋 Solicitud existente:', solicitudExistente)

          if (solicitudExistente) {
            await supabase.auth.signOut()
            if (solicitudExistente.estado === 'pendiente') {
              setStatus('pending')
              setMessage('Tu solicitud de acceso está siendo revisada por el administrador')
            } else if (solicitudExistente.estado === 'rechazada') {
              setStatus('error')
              setMessage(solicitudExistente.mensaje_admin || 'Tu solicitud fue rechazada. Contacta al administrador.')
            } else {
              setStatus('error')
              setMessage('Tu solicitud fue aprobada. Usa "Iniciar Sesión" con tus credenciales.')
            }
            return
          }

          // Crear nueva solicitud
          console.log('📝 Creando nueva solicitud...')
          await solicitudesAccesoService.create({
            email: email,
            nombre: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
            auth_provider: 'google',
            auth_user_id: user.id,
            mensaje_solicitud: 'Solicitud automática desde Google OAuth'
          })
          console.log('✅ Solicitud creada')

          await supabase.auth.signOut()
          setStatus('pending')
          setMessage('Solicitud de acceso creada. El administrador la revisará pronto.')
          return
        }

        // Flujo original con access token
        console.log('🔑 Usando access token para obtener usuario...')
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

        if (userError || !user) {
          console.error('❌ Error obteniendo usuario:', userError)
          throw new Error('No se pudo obtener los datos del usuario')
        }

        const email = user.email || ''
        console.log('📧 Email:', email)

        // Validar dominio
        const emailRegex = /^[a-zA-Z0-9._%+-]+@tecnycon\.cl$/i
        if (!emailRegex.test(email)) {
          await supabase.auth.signOut()
          setStatus('error')
          setMessage('Solo se permiten correos corporativos @tecnycon.cl')
          return
        }

        // Verificar usuario existente
        console.log('🔍 Buscando usuario en tabla usuarios...')
        const usuarioExistente = await usuariosService.getByEmail(email)
        console.log('👤 Usuario existente:', !!usuarioExistente)

        if (usuarioExistente) {
          setStatus('success')
          setMessage('Autenticación exitosa. Redirigiendo...')
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          // Verificar solicitud
          console.log('🔍 Buscando solicitud de acceso...')
          const solicitudExistente = await solicitudesAccesoService.getByEmail(email)
          console.log('📋 Solicitud existente:', solicitudExistente)

          if (solicitudExistente) {
            await supabase.auth.signOut()
            if (solicitudExistente.estado === 'pendiente') {
              setStatus('pending')
              setMessage('Tu solicitud de acceso está siendo revisada por el administrador')
            } else if (solicitudExistente.estado === 'rechazada') {
              setStatus('error')
              setMessage(solicitudExistente.mensaje_admin || 'Tu solicitud fue rechazada. Contacta al administrador.')
            }
          } else {
            // Crear solicitud
            console.log('📝 Creando nueva solicitud...')
            await solicitudesAccesoService.create({
              email: email,
              nombre: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
              auth_provider: 'google',
              auth_user_id: user.id,
              mensaje_solicitud: 'Solicitud automática desde Google OAuth'
            })
            console.log('✅ Solicitud creada')

            setStatus('pending')
            setMessage('Solicitud de acceso creada. El administrador la revisará pronto.')
          }

          await supabase.auth.signOut()
        }

      } catch (err: any) {
        console.error('❌ Error en callback de OAuth:', err)
        console.error('❌ Stack:', err.stack)
        console.error('❌ Error completo:', JSON.stringify(err, null, 2))
        setStatus('error')
        setMessage(`Error: ${err.message || 'Error al procesar la autenticación'}`)

        // No redirigir, mostrar el error
        setTimeout(() => {
          console.log('⏱️ Error mostrado, NO redirigiendo automáticamente')
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8fafc' }}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-6" style={{ backgroundColor: '#0066cc' }}>
            <Building2 className="h-12 w-12 text-white" />
          </div>

          {/* Estado Loading */}
          {status === 'loading' && (
            <>
              <div className="spinner h-12 w-12 mx-auto mb-4" style={{ borderTopColor: '#0066cc' }}></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Procesando autenticación...
              </h2>
              <p className="text-gray-600">Por favor espera un momento</p>
            </>
          )}

          {/* Estado Success */}
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Autenticación exitosa!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {/* Estado Pending (Solicitud creada) */}
          {status === 'pending' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <Clock className="h-10 w-10 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Solicitud Pendiente
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-900">
                  <strong>Próximos pasos:</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>El administrador revisará tu solicitud</li>
                  <li>Recibirás un correo cuando sea aprobada</li>
                  <li>Una vez aprobada, podrás iniciar sesión</li>
                </ul>
              </div>
              <Button
                onClick={() => router.push('/login')}
                style={{ backgroundColor: '#0066cc' }}
                className="text-white"
              >
                Volver al inicio
              </Button>
            </>
          )}

          {/* Estado Error */}
          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error de autenticación
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button
                onClick={() => router.push('/login')}
                style={{ backgroundColor: '#0066cc' }}
                className="text-white"
              >
                Volver al inicio
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

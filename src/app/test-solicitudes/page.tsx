"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import solicitudesAccesoService from "@/services/solicitudesAcceso"

export default function TestSolicitudesPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCrearSolicitud = async () => {
    setLoading(true)
    try {
      const solicitud = await solicitudesAccesoService.create({
        email: 'test@tecnycon.cl',
        nombre: 'Usuario Test',
        auth_provider: 'manual',
        mensaje_solicitud: 'Test de creación'
      })
      setResult({ success: true, data: solicitud })
    } catch (error: unknown) {
      setResult({ success: false, error: error instanceof Error ? error.message : String(error), details: error })
      console.error('Error completo:', error)
    } finally {
      setLoading(false)
    }
  }

  const testObtenerSolicitudes = async () => {
    setLoading(true)
    try {
      const solicitudes = await solicitudesAccesoService.getAll()
      setResult({ success: true, data: solicitudes, count: solicitudes.length })
    } catch (error: unknown) {
      setResult({ success: false, error: error instanceof Error ? error.message : String(error), details: error })
      console.error('Error completo:', error)
    } finally {
      setLoading(false)
    }
  }

  const testObtenerPendientes = async () => {
    setLoading(true)
    try {
      const count = await solicitudesAccesoService.countPendientes()
      setResult({ success: true, count })
    } catch (error: unknown) {
      setResult({ success: false, error: error instanceof Error ? error.message : String(error), details: error })
      console.error('Error completo:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test de Solicitudes de Acceso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testCrearSolicitud} disabled={loading}>
              Crear Solicitud Test
            </Button>
            <Button onClick={testObtenerSolicitudes} disabled={loading} variant="outline">
              Obtener Todas
            </Button>
            <Button onClick={testObtenerPendientes} disabled={loading} variant="outline">
              Contar Pendientes
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner h-8 w-8 mx-auto" style={{ borderTopColor: '#0066cc' }}></div>
              <p className="text-gray-600 mt-2">Procesando...</p>
            </div>
          )}

          {result && (
            <Card className={result.success ? 'bg-green-50' : 'bg-red-50'}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">
                  {result.success ? '✅ Éxito' : '❌ Error'}
                </h3>
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

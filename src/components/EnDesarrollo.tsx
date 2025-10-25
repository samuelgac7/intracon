"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft, Construction, Wrench } from "lucide-react"

interface EnDesarrolloProps {
  modulo: string
  descripcion?: string
  caracteristicas?: string[]
}

export default function EnDesarrollo({
  modulo,
  descripcion,
  caracteristicas = []
}: EnDesarrolloProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Icono animado */}
          <div className="relative inline-block mb-6">
            <Construction className="h-24 w-24 text-orange-500 mx-auto" />
            <Wrench className="h-12 w-12 text-gray-600 absolute -bottom-2 -right-2 animate-pulse" />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Módulo {modulo}
          </h1>

          {/* Badge */}
          <div className="inline-block px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
            🚧 En Desarrollo
          </div>

          {/* Descripción */}
          {descripcion && (
            <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto">
              {descripcion}
            </p>
          )}

          {/* Características planeadas */}
          {caracteristicas.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Funcionalidades Planeadas:
              </h3>
              <ul className="space-y-2">
                {caracteristicas.map((item, index) => (
                  <li key={index} className="text-blue-800 text-sm flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mensaje motivacional */}
          <p className="text-gray-500 text-sm mb-6">
            Este módulo estará disponible próximamente como parte de la plataforma completa.
          </p>

          {/* Botón volver */}
          <Button
            onClick={() => router.push('/dashboard')}
            size="lg"
            style={{ backgroundColor: '#0066cc', color: 'white' }}
            className="hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

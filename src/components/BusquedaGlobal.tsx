"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, Users, Building2, FileText, FileCheck, Clock, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import {
  buscarGlobal,
  guardarBusquedaReciente,
  obtenerBusquedasRecientes,
  limpiarBusquedasRecientes,
  type ResultadosBusqueda
} from '@/services/busqueda'

interface BusquedaGlobalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BusquedaGlobal({ open, onOpenChange }: BusquedaGlobalProps) {
  const router = useRouter()
  const { usuario } = useAuth()
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadosBusqueda | null>(null)
  const [loading, setLoading] = useState(false)
  const [recientes, setRecientes] = useState<string[]>([])

  // Cargar búsquedas recientes al abrir
  useEffect(() => {
    if (open) {
      setRecientes(obtenerBusquedasRecientes())
    }
  }, [open])

  // Búsqueda con debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResultados(null)
      return
    }

    setLoading(true)

    const timeout = setTimeout(async () => {
      try {
        const res = await buscarGlobal(
          query,
          20,
          usuario?.id,
          usuario?.obras_asignadas || undefined
        )
        setResultados(res)
      } catch (error) {
        console.error('Error en búsqueda:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, usuario])

  const handleSeleccionar = useCallback((link: string) => {
    guardarBusquedaReciente(query)
    onOpenChange(false)
    setQuery('')
    router.push(link)
  }, [query, onOpenChange, router])

  const handleBusquedaReciente = useCallback((busqueda: string) => {
    setQuery(busqueda)
  }, [])

  const handleLimpiarRecientes = useCallback(() => {
    limpiarBusquedasRecientes()
    setRecientes([])
  }, [])

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'trabajador': return <Users className="h-4 w-4" />
      case 'obra': return <Building2 className="h-4 w-4" />
      case 'documento': return <FileText className="h-4 w-4" />
      case 'contrato': return <FileCheck className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const getColorBadge = (tipo: string) => {
    switch (tipo) {
      case 'trabajador': return 'bg-blue-100 text-blue-800'
      case 'obra': return 'bg-orange-100 text-orange-800'
      case 'documento': return 'bg-purple-100 text-purple-800'
      case 'contrato': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden bg-white border-gray-200" aria-describedby="search-description">
        <DialogTitle className="sr-only">Búsqueda Global</DialogTitle>
        <DialogDescription id="search-description" className="sr-only">
          Buscar trabajadores, obras, documentos y contratos en el sistema
        </DialogDescription>
        <Command className="rounded-lg border-none">
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar trabajadores, obras, documentos, contratos..."
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {loading && (
              <div className="py-6 text-center text-sm text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#0066cc] border-t-transparent"></div>
                <p className="mt-2">Buscando...</p>
              </div>
            )}

            {!query && recientes.length > 0 && (
              <Command.Group heading="Búsquedas recientes" className="mb-2">
                {recientes.map((busqueda, i) => (
                  <Command.Item
                    key={i}
                    onSelect={() => handleBusquedaReciente(busqueda)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{busqueda}</span>
                  </Command.Item>
                ))}
                <button
                  onClick={handleLimpiarRecientes}
                  className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-1"
                >
                  Limpiar historial
                </button>
              </Command.Group>
            )}

            {!loading && resultados && resultados.total === 0 && query.length >= 2 && (
              <Command.Empty className="py-6 text-center text-sm text-gray-500">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No se encontraron resultados para &quot;{query}&quot;</p>
                <p className="text-xs text-gray-400 mt-1">Intenta con otros términos</p>
              </Command.Empty>
            )}

            {/* Trabajadores */}
            {resultados && resultados.trabajadores.length > 0 && (
              <Command.Group heading="Trabajadores" className="mb-3">
                {resultados.trabajadores.map((resultado) => (
                  <Command.Item
                    key={`trabajador-${resultado.id}`}
                    onSelect={() => handleSeleccionar(resultado.link)}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors aria-selected:bg-gray-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcono(resultado.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resultado.titulo}
                        </p>
                        <Badge className={`text-xs ${getColorBadge(resultado.tipo)}`}>
                          {resultado.subtitulo}
                        </Badge>
                      </div>
                      {resultado.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {resultado.descripcion}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Obras */}
            {resultados && resultados.obras.length > 0 && (
              <Command.Group heading="Obras" className="mb-3">
                {resultados.obras.map((resultado) => (
                  <Command.Item
                    key={`obra-${resultado.id}`}
                    onSelect={() => handleSeleccionar(resultado.link)}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors aria-selected:bg-gray-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcono(resultado.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resultado.titulo}
                        </p>
                        <Badge className={`text-xs ${getColorBadge(resultado.tipo)}`}>
                          {resultado.subtitulo}
                        </Badge>
                      </div>
                      {resultado.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {resultado.descripcion}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Documentos */}
            {resultados && resultados.documentos.length > 0 && (
              <Command.Group heading="Documentos" className="mb-3">
                {resultados.documentos.map((resultado) => (
                  <Command.Item
                    key={`documento-${resultado.id}`}
                    onSelect={() => handleSeleccionar(resultado.link)}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors aria-selected:bg-gray-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcono(resultado.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resultado.titulo}
                        </p>
                        <Badge className={`text-xs ${getColorBadge(resultado.tipo)}`}>
                          {resultado.subtitulo}
                        </Badge>
                      </div>
                      {resultado.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {resultado.descripcion}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Contratos */}
            {resultados && resultados.contratos.length > 0 && (
              <Command.Group heading="Contratos" className="mb-3">
                {resultados.contratos.map((resultado) => (
                  <Command.Item
                    key={`contrato-${resultado.id}`}
                    onSelect={() => handleSeleccionar(resultado.link)}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors aria-selected:bg-gray-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcono(resultado.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resultado.titulo}
                        </p>
                        <Badge className={`text-xs ${getColorBadge(resultado.tipo)}`}>
                          {resultado.subtitulo}
                        </Badge>
                      </div>
                      {resultado.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {resultado.descripcion}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer con atajos */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
                Seleccionar
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
              Cerrar
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { ReactNode } from 'react'

export default function ObrasLayout({ children }: { children: ReactNode }) {
  // Layout simple que pasa children
  // No hay vista dual a nivel de obra
  return <>{children}</>
}
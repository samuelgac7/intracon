"use client"

import { ReactNode } from 'react'

export default function TrabajadoresLayout({ children }: { children: ReactNode }) {
  // Layout simple que pasa children
  // La lógica de vista dual está en [id]/page.tsx
  return <>{children}</>
}
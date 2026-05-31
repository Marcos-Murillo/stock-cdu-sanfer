"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

// Rutas permitidas para el rol monitor (admin y superadmin: acceso total)
const MONITOR_ALLOWED_PATHS = ["/loans"]

function hasFullAccess(role: string | undefined) {
  return role === "admin" || role === "superadmin"
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/sin-acceso")
      return
    }
    // Si es monitor y la ruta no está permitida, redirigir a préstamos
    if (!hasFullAccess(user.role) && user.role === "monitor" && !MONITOR_ALLOWED_PATHS.includes(pathname)) {
      router.replace("/loans")
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <p className="text-blue-700">Cargando...</p>
      </div>
    )
  }

  if (!user) return null

  // Bloquear render si monitor intenta acceder a ruta no permitida
  if (!hasFullAccess(user.role) && user.role === "monitor" && !MONITOR_ALLOWED_PATHS.includes(pathname)) {
    return null
  }

  return <>{children}</>
}

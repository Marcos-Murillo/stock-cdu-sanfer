"use client"

import Link from "next/link"
import { Home, Package, Users, BarChart3, TrendingUp, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/lib/auth-context"

export default function Navigation() {
  const { totalCount } = useNotifications()
  const { user } = useAuth()
  const isMonitor = user?.role === "monitor"
  const isStaff = user?.role === "admin" || user?.role === "superadmin"

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={isMonitor ? "/loans" : "/"} className="flex items-center space-x-2">
            <Package className="w-6 h-6" />
            <span className="font-bold text-lg">Stock CDU · San Fernando</span>
          </Link>

          <div className="flex space-x-1">
            {!isMonitor && isStaff && (
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-blue-700">
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </Button>
              </Link>
            )}
            {!isMonitor && isStaff && (
              <Link href="/inventory">
                <Button variant="ghost" className="text-white hover:bg-blue-700">
                  <Package className="w-4 h-4 mr-2" />
                  Inventario
                </Button>
              </Link>
            )}
            <Link href="/prestamos">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                Préstamos público
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                Gestión préstamos
              </Button>
            </Link>
            {!isMonitor && isStaff && (
              <Link href="/reports">
                <Button variant="ghost" className="text-white hover:bg-blue-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reportes
                </Button>
              </Link>
            )}
            {!isMonitor && isStaff && (
              <Link href="/statistics">
                <Button variant="ghost" className="text-white hover:bg-blue-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Estadísticas
                </Button>
              </Link>
            )}
            {!isMonitor && isStaff && (
              <Link href="/notifications">
                <Button variant="ghost" className="text-white hover:bg-blue-700 relative">
                  <Bell className="w-4 h-4 mr-2" />
                  Notificaciones
                  {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {totalCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

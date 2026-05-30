"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, Users, BarChart3, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role === "monitor") {
      router.replace("/loans")
    }
  }, [user, loading, router])

  if (loading || user?.role === "monitor") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Inventario Deportivo · San Fernando</h1>
          <p className="text-lg text-blue-700 max-w-2xl mx-auto">
            Implementos y préstamos del CDU San Fernando. Usuarios desde Gym Control.
          </p>
          <Link href="/prestamos" className="inline-block mt-4">
            <Button variant="outline" className="border-blue-600 text-blue-700">
              Página pública de préstamos (usuarios)
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-blue-800">Inventario</CardTitle>
              <CardDescription>Agregar elementos, dar de baja y gestionar stock</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/inventory">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Gestionar Inventario</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-blue-800">Préstamos</CardTitle>
              <CardDescription>Prestar elementos y gestionar devoluciones</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/loans">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Gestionar Préstamos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-blue-800">Reportes</CardTitle>
              <CardDescription>Ver estadísticas y reportes del inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reports">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Ver Reportes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-blue-800">Estadísticas</CardTitle>
              <CardDescription>Análisis detallado de uso y préstamos</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/statistics">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Ver Estadísticas</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

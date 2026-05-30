"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default function RegistroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="max-w-md border-blue-200">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto mb-2 h-12 w-12 text-blue-600" />
          <CardTitle className="text-blue-800">Registro en Gym Control</CardTitle>
          <CardDescription>
            En San Fernando los usuarios se registran una sola vez en la app de gimnasio (CDU Control). Este
            inventario solo consulta esa base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            Si aún no tienes cuenta, regístrate en Gym Control con tu cédula o código estudiantil. Luego podrás
            solicitar implementos en la página de préstamos.
          </p>
          <Link href="/prestamos" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Ir a solicitar implementos</Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Volver al inicio (personal)
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

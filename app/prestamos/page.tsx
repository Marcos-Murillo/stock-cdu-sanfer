"use client"

import { useEffect, useState } from "react"
import { Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getInventory, createLoanBatch } from "@/lib/firebase"
import type { InventoryItem } from "@/lib/types"
import GymUserSearch from "@/components/gym-user-search"
import LoanCartForm from "@/components/loan-cart-form"
import type { LoanBorrowerForm } from "@/lib/loan-borrower"
import { buildLoansFromCart } from "@/lib/loan-utils"

export default function PrestamosPublicPage() {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [borrower, setBorrower] = useState<LoanBorrowerForm | null>(null)
  const [loadingInventory, setLoadingInventory] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    getInventory()
      .then((inventory) => {
        setAvailableItems(inventory.filter((item) => item.status === "available"))
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "No se pudo cargar el inventario",
          variant: "destructive",
        })
      })
      .finally(() => setLoadingInventory(false))
  }, [toast])

  const handleSubmit = async (cart: Parameters<typeof buildLoansFromCart>[1]) => {
    if (!borrower) return
    const loans = buildLoansFromCart(borrower, cart)
    await createLoanBatch(loans)
    toast({
      title: "Solicitud registrada",
      description: "Tu préstamo quedó registrado. Retira los implementos con el personal.",
    })
    setBorrower(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="border-b border-blue-200 bg-blue-600 text-white shadow">
        <div className="container mx-auto flex h-14 items-center px-4">
          <div className="flex items-center gap-2 font-bold">
            <Package className="h-6 w-6" />
            Préstamo de implementos · San Fernando
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-8">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Solicitar implementos</CardTitle>
            <CardDescription>
              Identifícate con la misma cédula o código de Gym Control. Solo debes registrarte una vez en la app
              de gimnasio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GymUserSearch onUserConfirmed={(form) => setBorrower(form)} onClear={() => setBorrower(null)} />

            {loadingInventory ? (
              <p className="text-sm text-gray-500">Cargando inventario...</p>
            ) : availableItems.length === 0 ? (
              <p className="text-sm text-amber-700">No hay implementos disponibles en este momento.</p>
            ) : (
              <LoanCartForm
                availableItems={availableItems}
                borrower={borrower}
                onSubmit={handleSubmit}
                submitLabel="Confirmar solicitud"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

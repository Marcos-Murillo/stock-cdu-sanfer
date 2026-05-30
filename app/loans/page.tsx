"use client"

import { useState, useEffect } from "react"
import { Search, UserCheck, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getInventory, getLoans, createLoanBatch, returnLoan, returnLoansBatch, returnLoanGroupPartial } from "@/lib/firebase"
import type { InventoryItem, Loan, CartItem } from "@/lib/types"
import Navigation from "@/components/navigation"
import GymUserSearch from "@/components/gym-user-search"
import LoanCartForm from "@/components/loan-cart-form"
import type { LoanBorrowerForm } from "@/lib/loan-borrower"
import { buildLoansFromCart } from "@/lib/loan-utils"
import { RouteGuard } from "@/components/route-guard"
import PartialReturnDialog from "@/components/partial-return-dialog"

export default function LoansPage() {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [borrower, setBorrower] = useState<LoanBorrowerForm | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Estado para el dialog de devolución parcial
  const [partialReturnGroup, setPartialReturnGroup] = useState<Loan[] | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = loans.filter((loan) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        (loan.borrowerName?.toLowerCase() || "").includes(searchLower) ||
        (loan.itemName?.toLowerCase() || "").includes(searchLower) ||
        (loan.itemSerialNumber?.toLowerCase() || "").includes(searchLower) ||
        (loan.borrowerDocument || "").includes(searchTerm) ||
        (loan.borrowerEmail?.toLowerCase() || "").includes(searchLower) ||
        (loan.borrowerCode || "").includes(searchTerm)
      )
    })
    setFilteredLoans(filtered)
  }, [loans, searchTerm])

  const loadData = async () => {
    try {
      const [inventory, loansList] = await Promise.all([getInventory(), getLoans()])

      const available = inventory.filter((item) => item.status === "available")
      setAvailableItems(available)
      setLoans(loansList)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    }
  }

  const handleStaffLoanSubmit = async (cart: CartItem[]) => {
    if (!borrower?.borrowerName) {
      toast({
        title: "Error",
        description: "Busca al usuario en Gym Control primero",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const allLoans = buildLoansFromCart(borrower, cart)
      await createLoanBatch(allLoans)
      const total = cart.reduce((n, c) => n + c.quantity, 0)
      toast({
        title: "Éxito",
        description: `Préstamo de ${total} elementos registrado correctamente`,
      })
      setBorrower(null)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el préstamo",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Agrupar préstamos por loanGroupId
  const groupedLoans = filteredLoans
    .filter((loan) => loan.status === "active")
    .reduce((groups, loan) => {
      const groupId = loan.loanGroupId || loan.id!
      if (!groups[groupId]) {
        groups[groupId] = []
      }
      groups[groupId].push(loan)
      return groups
    }, {} as Record<string, Loan[]>)

  const handleReturnLoan = async (loanId: string) => {
    if (!confirm("¿Confirmar la devolución de este elemento?")) {
      return
    }

    try {
      await returnLoan(loanId)
      toast({
        title: "Éxito",
        description: "Elemento devuelto correctamente",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución",
        variant: "destructive",
      })
    }
  }

  const handleReturnLoanGroup = async (groupLoans: Loan[]) => {
    const count = groupLoans.length
    if (!confirm(`¿Confirmar la devolución de ${count} ${count === 1 ? 'elemento' : 'elementos'}?`)) {
      return
    }

    try {
      await returnLoansBatch(groupLoans.map(l => ({ id: l.id!, itemId: l.itemId })))
      toast({
        title: "Éxito",
        description: `${count} ${count === 1 ? 'elemento devuelto' : 'elementos devueltos'} correctamente`,
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución",
        variant: "destructive",
      })
    }
  }

  const handlePartialReturn = async (missingItems: { name: string; missing: number }[]) => {
    if (!partialReturnGroup) return
    try {
      await returnLoanGroupPartial(
        partialReturnGroup.map((l) => ({ id: l.id!, itemId: l.itemId })),
        missingItems
      )
      toast({
        title: "Devolución registrada",
        description: `Devolución con faltantes registrada`,
      })
      setPartialReturnGroup(null)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <RouteGuard>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Préstamos · San Fernando</h1>
        </div>

        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Izquierdo - Nuevo Préstamo (1/3) */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Nuevo Préstamo
                </CardTitle>
                <CardDescription>Complete los datos para registrar un préstamo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <GymUserSearch
                    onUserConfirmed={(form) => setBorrower(form)}
                    onClear={() => setBorrower(null)}
                  />
                  <LoanCartForm
                    availableItems={availableItems}
                    borrower={borrower}
                    onSubmit={handleStaffLoanSubmit}
                    submitLabel="Registrar préstamo"
                    loading={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Derecho - Préstamos Activos (2/3) */}
          <div className="lg:col-span-2">
            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="text-blue-800">Préstamos Activos</CardTitle>
                    <CardDescription>
                      {filteredLoans.filter((loan) => loan.status === "active").length} préstamos activos
                    </CardDescription>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, elemento, serie, cédula, código o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {Object.entries(groupedLoans).map(([groupId, groupLoans]) => {
                    const firstLoan = groupLoans[0]
                    const isMultiple = groupLoans.length > 1

                    return (
                      <div
                        key={groupId}
                        className="border border-blue-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <p className="font-semibold text-blue-800">{firstLoan.borrowerName}</p>
                                {isMultiple && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {groupLoans.length} elementos
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Cédula: {firstLoan.borrowerDocument}</p>
                                  {firstLoan.borrowerCode && <p>Código: {firstLoan.borrowerCode}</p>}
                                  <p>Tel: {firstLoan.borrowerPhone}</p>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Estamento: {firstLoan.estamento}</p>
                                  <p>
                                    Préstamo:{' '}
                                    {firstLoan.loanDate.toLocaleString('es-CO', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}
                                  </p>
                                  {firstLoan.facultad && <p className="truncate">Facultad: {firstLoan.facultad}</p>}
                                </div>
                              </div>

                              {/* Lista de elementos agrupados por nombre */}
                              <div className="border-t pt-3 mt-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">ELEMENTOS PRESTADOS:</p>
                                <div className="space-y-1">
                                  {Object.entries(
                                    groupLoans.reduce((acc, loan) => {
                                      acc[loan.itemName] = (acc[loan.itemName] || 0) + 1
                                      return acc
                                    }, {} as Record<string, number>)
                                  ).map(([name, qty]) => (
                                    <div key={name} className="flex items-center p-2 bg-gray-50 rounded">
                                      <p className="text-sm font-medium text-gray-800">
                                        {name}{qty > 1 ? ` - ${qty}` : ""}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <Badge className="bg-orange-100 text-orange-800">Prestado</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReturnLoanGroup(groupLoans)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Package className="w-4 h-4 mr-1" />
                                Devolver {isMultiple ? 'Todo' : ''}
                              </Button>
                              {isMultiple && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPartialReturnGroup(groupLoans)}
                                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  <Package className="w-4 h-4 mr-1" />
                                  Regreso con Faltas
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(groupedLoans).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      {searchTerm ? "No se encontraron préstamos" : "No hay préstamos activos"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    {partialReturnGroup && (
      <PartialReturnDialog
        isOpen={true}
        onClose={() => setPartialReturnGroup(null)}
        onConfirm={handlePartialReturn}
        itemGroups={Object.entries(
          partialReturnGroup.reduce((acc, l) => {
            acc[l.itemName] = (acc[l.itemName] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([name, total]) => ({ name, total }))}
        borrowerName={partialReturnGroup[0].borrowerName}
      />
    )}
    </RouteGuard>
  )
}

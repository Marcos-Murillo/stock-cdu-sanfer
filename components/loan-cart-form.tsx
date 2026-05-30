"use client"

import type React from "react"
import { useState } from "react"
import { Plus, ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { CartItem, InventoryItem } from "@/lib/types"
import type { LoanBorrowerForm } from "@/lib/loan-borrower"

interface LoanCartFormProps {
  availableItems: InventoryItem[]
  borrower: LoanBorrowerForm | null
  onSubmit: (cart: CartItem[]) => Promise<void>
  submitLabel?: string
  loading?: boolean
}

export default function LoanCartForm({
  availableItems,
  borrower,
  onSubmit,
  submitLabel = "Registrar préstamo",
  loading: externalLoading = false,
}: LoanCartFormProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItemName, setSelectedItemName] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const uniqueItemNames = Array.from(new Set(availableItems.map((item) => item.name)))

  const getAvailableItemsByName = (name: string) => availableItems.filter((item) => item.name === name)

  const getTotalItemsInCart = () => cart.reduce((total, item) => total + item.quantity, 0)

  const handleAddToCart = () => {
    if (!selectedItemName) {
      toast({ title: "Error", description: "Selecciona un elemento", variant: "destructive" })
      return
    }

    const availableForName = getAvailableItemsByName(selectedItemName)
    if (selectedQuantity > availableForName.length) {
      toast({
        title: "Error",
        description: `Solo hay ${availableForName.length} ${selectedItemName} disponibles`,
        variant: "destructive",
      })
      return
    }

    if (cart.find((item) => item.itemName === selectedItemName)) {
      toast({ title: "Error", description: "Este elemento ya está en el carrito", variant: "destructive" })
      return
    }

    const itemsToAdd = availableForName.slice(0, selectedQuantity)
    setCart([
      ...cart,
      { itemName: selectedItemName, items: itemsToAdd, quantity: selectedQuantity },
    ])
    setSelectedItemName("")
    setSelectedQuantity(1)
    toast({
      title: "Agregado",
      description: `${selectedQuantity} ${selectedItemName} agregado(s)`,
    })
  }

  const handleRemoveFromCart = (itemName: string) => {
    setCart(cart.filter((item) => item.itemName !== itemName))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!borrower?.borrowerName) {
      toast({ title: "Error", description: "Primero identifícate con cédula o código", variant: "destructive" })
      return
    }
    if (cart.length === 0) {
      toast({ title: "Error", description: "Agrega al menos un implemento", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(cart)
      setCart([])
      setSelectedItemName("")
      setSelectedQuantity(1)
    } finally {
      setSubmitting(false)
    }
  }

  const busy = submitting || externalLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-t pt-4">
        <Label className="mb-2 block text-sm font-semibold text-blue-800">Implementos a solicitar</Label>
        <div className="space-y-2">
          <Select value={selectedItemName} onValueChange={setSelectedItemName}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar implemento" />
            </SelectTrigger>
            <SelectContent>
              {uniqueItemNames.map((name) => {
                const available = getAvailableItemsByName(name).length
                return (
                  <SelectItem key={name} value={name}>
                    {name} ({available} disponibles)
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {selectedItemName && (
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={getAvailableItemsByName(selectedItemName).length}
                value={selectedQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) setSelectedQuantity(val)
                }}
                placeholder="Cantidad"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddToCart} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="border-t pt-4">
          <Label className="mb-2 block text-sm font-semibold text-blue-800">
            <ShoppingCart className="mr-1 inline h-4 w-4" />
            Carrito ({getTotalItemsInCart()})
          </Label>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {cart.map((cartItem) => (
              <div
                key={cartItem.itemName}
                className="flex items-center justify-between rounded border border-blue-200 bg-blue-50 p-2"
              >
                <div>
                  <p className="text-sm font-medium text-blue-800">{cartItem.itemName}</p>
                  <p className="text-xs text-gray-600">Cantidad: {cartItem.quantity}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromCart(cartItem.itemName)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={busy || !borrower?.borrowerName || cart.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {busy ? "Registrando..." : `${submitLabel} (${getTotalItemsInCart()} elementos)`}
      </Button>
    </form>
  )
}

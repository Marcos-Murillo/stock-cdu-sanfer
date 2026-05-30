"use client"

import { useState } from "react"
import { Search, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { lookupGymUser, GYM_REGISTRATION_HINT } from "@/lib/gym-user-lookup"
import type { GymUserProfile } from "@/lib/gym-user-lookup"
import { loanBorrowerFromGymUser, type LoanBorrowerForm } from "@/lib/loan-borrower"

interface GymUserSearchProps {
  onUserConfirmed: (form: LoanBorrowerForm, gymUser: GymUserProfile) => void
  onClear?: () => void
}

export default function GymUserSearch({ onUserConfirmed, onClear }: GymUserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [gymUser, setGymUser] = useState<GymUserProfile | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    const term = searchTerm.trim()
    if (!term) return

    setError("")
    setGymUser(null)
    onClear?.()
    setLoading(true)

    try {
      const found = await lookupGymUser(term)
      if (!found) {
        setError(GYM_REGISTRATION_HINT)
      } else if (!found.activo) {
        setError("Tu usuario no está activo en Gym Control. Contacta al personal del CDU.")
      } else {
        setGymUser(found)
        onUserConfirmed(loanBorrowerFromGymUser(found), found)
      }
    } catch {
      setError("Error al buscar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchTerm("")
    setGymUser(null)
    setError("")
    onClear?.()
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gymSearch">Cédula o código estudiantil</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="gymSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ingresa tu documento o código"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            disabled={loading}
          />
          <Button type="button" onClick={handleSearch} disabled={loading || !searchTerm.trim()}>
            <Search className="mr-1 h-4 w-4" />
            {loading ? "..." : "Buscar"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {gymUser && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-green-800">
            <UserCheck className="h-5 w-5" />
            <span className="font-semibold">{gymUser.nombres}</span>
          </div>
          <div className="space-y-1 text-sm text-green-900">
            <p>Documento: {gymUser.numeroDocumento}</p>
            {gymUser.codigoEstudiantil && <p>Código: {gymUser.codigoEstudiantil}</p>}
            <p>{gymUser.estamento}</p>
            {gymUser.facultad && <p className="text-xs">{gymUser.facultad}</p>}
          </div>
          <Button type="button" variant="link" className="mt-2 h-auto p-0 text-green-700" onClick={handleReset}>
            Cambiar usuario
          </Button>
        </div>
      )}
    </div>
  )
}

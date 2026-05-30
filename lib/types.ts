export type UserRole = "superadmin" | "admin" | "monitor"

export interface StockUser {
  uid: string
  nombre: string
  cedula: string
  role: UserRole
}

export interface InventoryItem {
  id?: string
  name: string
  serialNumber: string
  description: string
  status: "available" | "loaned" | "removed"
  createdAt: Date
  loanCount?: number
  location?: string
}

export interface Loan {
  id?: string
  itemId: string
  itemName: string
  itemSerialNumber: string
  borrowerName: string
  borrowerDocument: string
  borrowerPhone?: string
  borrowerEmail?: string
  borrowerCode?: string
  facultad?: string
  programa?: string
  genero: string
  etnia?: string
  sede?: string
  estamento?: string
  loanDate: Date
  returnDate?: Date
  status: "active" | "returned"
  notes?: string
  loanGroupId?: string
  // Devolución parcial: detalle de implementos no entregados por tipo
  missingItems?: MissingItemRecord[]
  /** Cuando todos los faltantes fueron devueltos */
  missingResolvedAt?: Date
}

export interface MissingItemRecord {
  name: string
  missing: number
  /** Unidades del faltante ya devueltas después */
  returned?: number
}

export interface DamageReport {
  id?: string
  itemId: string
  itemName: string
  itemSerialNumber: string
  reportedBy: string
  reportDate: Date
  damageDescription: string
  severity: "low" | "medium" | "high"
  status?: string
}

export interface CartItem {
  itemName: string
  quantity: number
  items: InventoryItem[]
}

export interface LoanNotification {
  loanId: string
  borrowerName: string
  borrowerDocument: string
  itemName: string
  alertLevel: "24h" | "3days" | "7days"
  shouldReport: boolean
  daysOverdue: number
  loan: Loan
}

export interface BorrowerSuggestion {
  name: string
  document: string
  phone?: string
  email?: string
  code?: string
  facultad?: string
  programa?: string
  genero?: string
  etnia?: string
  sede?: string
  estamento?: string
}

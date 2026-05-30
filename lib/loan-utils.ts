import type { Loan, MissingItemRecord, CartItem } from "./types"
import type { LoanBorrowerForm } from "./loan-borrower"

export function formatDateTime(date: Date): string {
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function remainingMissing(item: MissingItemRecord): number {
  return Math.max(0, item.missing - (item.returned ?? 0))
}

export function hasPendingMissing(loan: Loan): boolean {
  if (!loan.missingItems?.length) return false
  return loan.missingItems.some((mi) => remainingMissing(mi) > 0)
}

export function totalPendingMissing(loan: Loan): number {
  if (!loan.missingItems?.length) return 0
  return loan.missingItems.reduce((sum, mi) => sum + remainingMissing(mi), 0)
}

export interface LoanGroupSummary {
  groupId: string
  loans: Loan[]
  primaryLoan: Loan
  borrowerName: string
  borrowerDocument: string
  borrowerCode?: string
  borrowerEmail?: string
  borrowerPhone?: string
  loanDate: Date
  returnDate?: Date
  itemNames: string[]
  hadMissing: boolean
  missingResolved: boolean
  missingItems?: MissingItemRecord[]
}

export function buildLoanGroupSummaries(loans: Loan[]): LoanGroupSummary[] {
  const returned = loans.filter((l) => l.status === "returned")
  const byGroup = new Map<string, Loan[]>()

  for (const loan of returned) {
    const gid = loan.loanGroupId || loan.id!
    const list = byGroup.get(gid) ?? []
    list.push(loan)
    byGroup.set(gid, list)
  }

  return Array.from(byGroup.entries()).map(([groupId, groupLoans]) => {
    const sorted = [...groupLoans].sort((a, b) => a.loanDate.getTime() - b.loanDate.getTime())
    const withMissing = groupLoans.find((l) => l.missingItems && l.missingItems.length > 0)
    const primaryLoan = withMissing ?? sorted[0]
    const returnDates = groupLoans.map((l) => l.returnDate).filter((d): d is Date => Boolean(d))
    const latestReturn =
      returnDates.length > 0 ? new Date(Math.max(...returnDates.map((d) => d.getTime()))) : undefined

    const itemNames = Array.from(new Set(groupLoans.map((l) => l.itemName).filter(Boolean)))

    const hadMissing = Boolean(primaryLoan.missingItems?.length)
    const missingResolved =
      hadMissing && (Boolean(primaryLoan.missingResolvedAt) || !hasPendingMissing(primaryLoan))

    return {
      groupId,
      loans: groupLoans,
      primaryLoan,
      borrowerName: primaryLoan.borrowerName,
      borrowerDocument: primaryLoan.borrowerDocument,
      borrowerCode: primaryLoan.borrowerCode,
      borrowerEmail: primaryLoan.borrowerEmail,
      borrowerPhone: primaryLoan.borrowerPhone,
      loanDate: sorted[0]?.loanDate ?? primaryLoan.loanDate,
      returnDate: latestReturn,
      itemNames,
      hadMissing,
      missingResolved,
      missingItems: primaryLoan.missingItems,
    }
  })
}

export function matchesLoanGroupSearch(group: LoanGroupSummary, term: string): boolean {
  const q = term.trim().toLowerCase()
  if (!q) return true

  if (group.borrowerName.toLowerCase().includes(q)) return true
  if (group.borrowerDocument.toLowerCase().includes(q)) return true
  if (group.borrowerCode?.toLowerCase().includes(q)) return true
  if (group.itemNames.some((n) => n.toLowerCase().includes(q))) return true

  return false
}

export function buildLoansFromCart(
  borrower: LoanBorrowerForm,
  cart: CartItem[],
  loanDate = new Date(),
): Omit<Loan, "id">[] {
  const loanGroupId = `${Date.now()}-${borrower.borrowerDocument}`
  const allLoans: Omit<Loan, "id">[] = []

  for (const cartItem of cart) {
    for (const item of cartItem.items) {
      const loanData: Omit<Loan, "id"> = {
        borrowerName: borrower.borrowerName,
        borrowerDocument: borrower.borrowerDocument,
        borrowerPhone: borrower.borrowerPhone,
        borrowerEmail: borrower.borrowerEmail,
        genero: borrower.genero,
        etnia: borrower.etnia,
        sede: borrower.sede,
        estamento: borrower.estamento,
        itemId: item.id!,
        itemName: item.name,
        itemSerialNumber: item.serialNumber,
        loanDate,
        status: "active",
        loanGroupId,
      }
      if (borrower.borrowerCode) loanData.borrowerCode = borrower.borrowerCode
      if (borrower.facultad) loanData.facultad = borrower.facultad
      if (borrower.programa) loanData.programa = borrower.programa
      allLoans.push(loanData)
    }
  }

  return allLoans
}

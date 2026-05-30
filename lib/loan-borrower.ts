import type { GymUserProfile } from "./gym-user-lookup"
import type { BorrowerSuggestion } from "./types"

export const SF_LOAN_SEDE = "SAN FERNANDO"

export interface LoanBorrowerForm {
  borrowerName: string
  borrowerDocument: string
  borrowerPhone: string
  borrowerEmail: string
  borrowerCode: string
  facultad: string
  programa: string
  genero: string
  etnia: string
  sede: string
  estamento: string
  gymUserId: string
}

export function emptyLoanBorrowerForm(): LoanBorrowerForm {
  return {
    borrowerName: "",
    borrowerDocument: "",
    borrowerPhone: "",
    borrowerEmail: "",
    borrowerCode: "",
    facultad: "",
    programa: "",
    genero: "",
    etnia: "",
    sede: SF_LOAN_SEDE,
    estamento: "",
    gymUserId: "",
  }
}

export function loanBorrowerFromGymUser(user: GymUserProfile): LoanBorrowerForm {
  return {
    borrowerName: user.nombres,
    borrowerDocument: user.numeroDocumento,
    borrowerPhone: user.telefono,
    borrowerEmail: user.correo,
    borrowerCode: user.codigoEstudiantil ?? "",
    facultad: user.facultad,
    programa: user.programaAcademico,
    genero: user.genero,
    etnia: "",
    sede: SF_LOAN_SEDE,
    estamento: user.estamento,
    gymUserId: user.id,
  }
}

export function gymUserToSuggestion(user: GymUserProfile): BorrowerSuggestion {
  return {
    name: user.nombres,
    document: user.numeroDocumento,
    phone: user.telefono,
    email: user.correo,
    code: user.codigoEstudiantil,
    facultad: user.facultad,
    programa: user.programaAcademico,
    genero: user.genero,
    etnia: "",
    sede: SF_LOAN_SEDE,
    estamento: user.estamento,
  }
}

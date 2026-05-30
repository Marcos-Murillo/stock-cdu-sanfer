import { collection, getDocs, query, where, limit } from "firebase/firestore"
import { gymDb } from "./gym-firebase"

const USERS_COLLECTION = "users"

export interface GymUserProfile {
  id: string
  nombres: string
  correo: string
  genero: string
  tipoDocumento: string
  numeroDocumento: string
  telefono: string
  estamento: string
  facultad: string
  programaAcademico: string
  codigoEstudiantil?: string
  activo: boolean
}

function mapUserDoc(id: string, data: Record<string, unknown>): GymUserProfile {
  return {
    id,
    nombres: String(data.nombres ?? ""),
    correo: String(data.correo ?? ""),
    genero: String(data.genero ?? ""),
    tipoDocumento: String(data.tipoDocumento ?? ""),
    numeroDocumento: String(data.numeroDocumento ?? ""),
    telefono: String(data.telefono ?? ""),
    estamento: String(data.estamento ?? ""),
    facultad: String(data.facultad ?? ""),
    programaAcademico: String(data.programaAcademico ?? ""),
    codigoEstudiantil: data.codigoEstudiantil ? String(data.codigoEstudiantil) : undefined,
    activo: data.activo !== false,
  }
}

/** Una consulta indexada por campo; no descarga toda la colección. */
async function queryByField(field: string, value: string): Promise<GymUserProfile | null> {
  const q = query(collection(gymDb, USERS_COLLECTION), where(field, "==", value), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return mapUserDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
}

/**
 * Busca usuario en Gym Control por cédula o código estudiantil (coincidencia exacta).
 */
export async function lookupGymUser(searchTerm: string): Promise<GymUserProfile | null> {
  const term = searchTerm.trim()
  if (!term) return null

  const byDocument = await queryByField("numeroDocumento", term)
  if (byDocument) return byDocument

  const byCode = await queryByField("codigoEstudiantil", term)
  if (byCode) return byCode

  return null
}

export const GYM_REGISTRATION_HINT =
  "No estás registrado en Gym Control. Regístrate primero en la app de gimnasio (CDU Control) y vuelve a intentar."

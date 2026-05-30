// Configuración de Firebase con nuevas funciones
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  increment,
  writeBatch,
} from "firebase/firestore"
import type { InventoryItem, Loan, DamageReport } from "./types"

// Firebase Stock CDU — San Fernando (implementos y préstamos)
const firebaseConfig = {
  apiKey: "AIzaSyBhdMWSdpGS-xLSmJf0LPwlAgXqSWU3Jxo",
  authDomain: "stockcdusanfer.firebaseapp.com",
  projectId: "stockcdusanfer",
  storageBucket: "stockcdusanfer.firebasestorage.app",
  messagingSenderId: "555150889561",
  appId: "1:555150889561:web:e299e12b3c0c8314461748",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Funciones para el inventario
export const addItem = async (item: Omit<InventoryItem, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "inventory"), {
      ...item,
      createdAt: Timestamp.fromDate(item.createdAt),
      loanCount: 0,
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding item:", error)
    if (error instanceof Error) {
      throw new Error(`Error al agregar elemento: ${error.message}`)
    }
    throw new Error("Error desconocido al agregar elemento")
  }
}

// Batch insert up to 500 items (Firestore batch limit = 500 ops)
export const addItemsBatch = async (items: Omit<InventoryItem, "id">[]): Promise<void> => {
  try {
    for (let i = 0; i < items.length; i += 500) {
      const chunk = items.slice(i, i + 500)
      const batch = writeBatch(db)
      for (const item of chunk) {
        const ref = doc(collection(db, "inventory"))
        batch.set(ref, { ...item, createdAt: Timestamp.fromDate(item.createdAt), loanCount: 0 })
      }
      await batch.commit()
    }
  } catch (error) {
    console.error("Error adding items batch:", error)
    if (error instanceof Error) throw new Error(`Error al agregar elementos: ${error.message}`)
    throw new Error("Error desconocido al agregar elementos")
  }
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "inventory"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as InventoryItem[]
  } catch (error) {
    console.error("Error getting inventory:", error)
    if (error instanceof Error) {
      throw new Error(`Error al cargar inventario: ${error.message}`)
    }
    throw new Error("Error desconocido al cargar inventario")
  }
}

export const removeItem = async (itemId: string) => {
  try {
    await deleteDoc(doc(db, "inventory", itemId))
  } catch (error) {
    console.error("Error removing item:", error)
    if (error instanceof Error) {
      throw new Error(`Error al eliminar elemento: ${error.message}`)
    }
    throw new Error("Error desconocido al eliminar elemento")
  }
}

export const updateItemStatus = async (itemId: string, status: "available" | "loaned" | "removed") => {
  try {
    await updateDoc(doc(db, "inventory", itemId), { status })
  } catch (error) {
    console.error("Error updating item status:", error)
    if (error instanceof Error) {
      throw new Error(`Error al actualizar estado: ${error.message}`)
    }
    throw new Error("Error desconocido al actualizar estado")
  }
}

export const updateItem = async (itemId: string, updates: Partial<InventoryItem>) => {
  try {
    // Firestore no acepta undefined — filtrar campos con valor undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    )
    await updateDoc(doc(db, "inventory", itemId), cleanUpdates)
  } catch (error) {
    console.error("Error updating item:", error)
    if (error instanceof Error) {
      throw new Error(`Error al actualizar elemento: ${error.message}`)
    }
    throw new Error("Error desconocido al actualizar elemento")
  }
}

// Funciones para préstamos
export const createLoan = async (loan: Omit<Loan, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "loans"), {
      ...loan,
      loanDate: Timestamp.fromDate(loan.loanDate),
      createdAt: Timestamp.now(),
    })

    // Actualizar el estado del elemento y incrementar contador
    await updateItemStatus(loan.itemId, "loaned")
    await updateDoc(doc(db, "inventory", loan.itemId), {
      loanCount: increment(1),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating loan:", error)
    if (error instanceof Error) {
      throw new Error(`Error al crear préstamo: ${error.message}`)
    }
    throw new Error("Error desconocido al crear préstamo")
  }
}

// Firestore writeBatch limit is 500 ops. Each loan = 3 ops (loan write + status + loanCount).
// Max ~166 items per batch — we chunk at 150 to be safe.
const BATCH_CHUNK = 150

export const createLoanBatch = async (loans: Omit<Loan, "id">[]): Promise<string[]> => {
  try {
    const ids: string[] = []
    const now = Timestamp.now()

    // Process in chunks of BATCH_CHUNK
    for (let i = 0; i < loans.length; i += BATCH_CHUNK) {
      const chunk = loans.slice(i, i + BATCH_CHUNK)
      const batch = writeBatch(db)

      for (const loan of chunk) {
        const loanRef = doc(collection(db, "loans"))
        ids.push(loanRef.id)
        batch.set(loanRef, {
          ...loan,
          loanDate: Timestamp.fromDate(loan.loanDate),
          createdAt: now,
        })
        const itemRef = doc(db, "inventory", loan.itemId)
        batch.update(itemRef, { status: "loaned", loanCount: increment(1) })
      }

      await batch.commit()
    }

    return ids
  } catch (error) {
    console.error("Error creating loan batch:", error)
    if (error instanceof Error) throw new Error(`Error al crear préstamos: ${error.message}`)
    throw new Error("Error desconocido al crear préstamos")
  }
}

export const returnLoansBatch = async (
  groupLoans: { id: string; itemId: string }[],
  missingItems?: { name: string; missing: number }[]
): Promise<void> => {
  try {
    const now = Timestamp.now()

    for (let i = 0; i < groupLoans.length; i += BATCH_CHUNK) {
      const chunk = groupLoans.slice(i, i + BATCH_CHUNK)
      const batch = writeBatch(db)

      for (let j = 0; j < chunk.length; j++) {
        const loan = chunk[j]
        const loanRef = doc(db, "loans", loan.id)
        // Attach missingItems only to the very first loan of the first chunk
        if (i === 0 && j === 0 && missingItems) {
          const itemsWithReturned = missingItems.map((mi) => ({
            name: mi.name,
            missing: mi.missing,
            returned: 0,
          }))
          batch.update(loanRef, {
            status: "returned",
            returnDate: now,
            missingItems: itemsWithReturned,
          })
        } else {
          batch.update(loanRef, { status: "returned", returnDate: now })
        }
        batch.update(doc(db, "inventory", loan.itemId), { status: "available" })
      }

      await batch.commit()
    }
  } catch (error) {
    console.error("Error returning loans batch:", error)
    if (error instanceof Error) throw new Error(`Error al procesar devolución: ${error.message}`)
    throw new Error("Error desconocido al procesar devolución")
  }
}

function mapLoanDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Loan {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    ...data,
    loanDate: (data.loanDate as { toDate: () => Date }).toDate(),
    returnDate: data.returnDate
      ? (data.returnDate as { toDate: () => Date }).toDate()
      : undefined,
    missingResolvedAt: data.missingResolvedAt
      ? (data.missingResolvedAt as { toDate: () => Date }).toDate()
      : undefined,
    missingItems: data.missingItems as Loan['missingItems'],
  } as Loan
}

export const getLoans = async (): Promise<Loan[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "loans"), orderBy("loanDate", "desc")))
    return querySnapshot.docs.map((d) => mapLoanDoc(d))
  } catch (error) {
    console.error("Error getting loans:", error)
    if (error instanceof Error) {
      throw new Error(`Error al cargar préstamos: ${error.message}`)
    }
    throw new Error("Error desconocido al cargar préstamos")
  }
}

// Devolución con faltantes: usa batch para procesar todos los préstamos del grupo en paralelo
export const returnLoanGroupPartial = async (
  groupLoans: { id: string; itemId: string }[],
  missingItems: { name: string; missing: number }[]
) => {
  return returnLoansBatch(groupLoans, missingItems)
}

/** Devuelve implementos que faltaban en un préstamo ya cerrado con faltantes */
export const returnMissingItems = async (
  loanId: string,
  returnedItems: { name: string; quantity: number }[],
): Promise<void> => {
  try {
    const loanRef = doc(db, "loans", loanId)
    const loanSnap = await getDoc(loanRef)

    if (!loanSnap.exists()) {
      throw new Error("Préstamo no encontrado")
    }

    const data = loanSnap.data()
    const current = (data.missingItems ?? []) as Loan["missingItems"]

    if (!current?.length) {
      throw new Error("Este préstamo no tiene faltantes registrados")
    }

    const updated = current.map((mi) => {
      const entry = returnedItems.find((r) => r.name === mi.name)
      if (!entry || entry.quantity <= 0) return mi
      const already = mi.returned ?? 0
      const pending = mi.missing - already
      const add = Math.min(entry.quantity, pending)
      return { ...mi, returned: already + add }
    })

    const allResolved = updated.every(
      (mi) => mi.missing - (mi.returned ?? 0) <= 0,
    )

    if (allResolved) {
      await updateDoc(loanRef, {
        missingItems: updated,
        missingResolvedAt: Timestamp.now(),
      })
    } else {
      await updateDoc(loanRef, { missingItems: updated })
    }
  } catch (error) {
    console.error("Error returning missing items:", error)
    if (error instanceof Error) {
      throw new Error(`Error al registrar devolución de faltantes: ${error.message}`)
    }
    throw new Error("Error desconocido al registrar devolución de faltantes")
  }
}

export const returnLoan = async (loanId: string) => {
  try {
    const loanRef = doc(db, "loans", loanId)
    const loanSnap = await getDoc(loanRef)

    if (!loanSnap.exists()) {
      throw new Error("Préstamo no encontrado")
    }

    const loanData = loanSnap.data()

    await updateDoc(loanRef, {
      status: "returned",
      returnDate: Timestamp.now(),
    })

    await updateItemStatus(loanData.itemId, "available")
  } catch (error) {
    console.error("Error returning loan:", error)
    if (error instanceof Error) {
      throw new Error(`Error al procesar devolución: ${error.message}`)
    }
    throw new Error("Error desconocido al procesar devolución")
  }
}

// Funciones para reportes de daños
export const createDamageReport = async (report: Omit<DamageReport, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "damageReports"), {
      ...report,
      reportDate: Timestamp.fromDate(report.reportDate),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating damage report:", error)
    if (error instanceof Error) {
      throw new Error(`Error al crear reporte: ${error.message}`)
    }
    throw new Error("Error desconocido al crear reporte")
  }
}

export const getDamageReports = async (): Promise<DamageReport[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "damageReports"), orderBy("reportDate", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportDate: doc.data().reportDate.toDate(),
    })) as DamageReport[]
  } catch (error) {
    console.error("Error getting damage reports:", error)
    return []
  }
}

// Función para obtener estadísticas detalladas
export const getDetailedStats = async () => {
  try {
    const [inventory, loans, damageReports] = await Promise.all([getInventory(), getLoans(), getDamageReports()])

    // Estadísticas por elemento
    const itemStats = inventory.map((item) => {
      const itemLoans = loans.filter((loan) => loan.itemId === item.id)
      const itemDamages = damageReports.filter((report) => report.itemId === item.id)

      return {
        ...item,
        totalLoans: itemLoans.length,
        activeLoans: itemLoans.filter((loan) => loan.status === "active").length,
        returnedLoans: itemLoans.filter((loan) => loan.status === "returned").length,
        damageReports: itemDamages.length,
        lastLoanDate: itemLoans.length > 0 ? itemLoans[0].loanDate : null,
      }
    })

    // Estadísticas por facultad
    const facultadStats = loans.reduce(
      (acc, loan) => {
        if (loan.facultad) {
          if (!acc[loan.facultad]) {
            acc[loan.facultad] = {
              totalLoans: 0,
              activeLoans: 0,
              returnedLoans: 0,
            }
          }
          acc[loan.facultad].totalLoans++
          if (loan.status === "active") {
            acc[loan.facultad].activeLoans++
          } else {
            acc[loan.facultad].returnedLoans++
          }
        }
        return acc
      },
      {} as Record<string, any>,
    )

    // Estadísticas por programa
    const programaStats = loans.reduce(
      (acc, loan) => {
        if (loan.programa) {
          if (!acc[loan.programa]) {
            acc[loan.programa] = {
              totalLoans: 0,
              activeLoans: 0,
              returnedLoans: 0,
            }
          }
          acc[loan.programa].totalLoans++
          if (loan.status === "active") {
            acc[loan.programa].activeLoans++
          } else {
            acc[loan.programa].returnedLoans++
          }
        }
        return acc
      },
      {} as Record<string, any>,
    )

    // Estadísticas por género
    const generoStats = loans.reduce(
      (acc, loan) => {
        if (!acc[loan.genero]) {
          acc[loan.genero] = {
            totalLoans: 0,
            activeLoans: 0,
            returnedLoans: 0,
          }
        }
        acc[loan.genero].totalLoans++
        if (loan.status === "active") {
          acc[loan.genero].activeLoans++
        } else {
          acc[loan.genero].returnedLoans++
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      itemStats: itemStats.sort((a, b) => b.totalLoans - a.totalLoans),
      facultadStats,
      programaStats,
      generoStats,
      totalItems: inventory.length,
      totalLoans: loans.length,
      activeLoans: loans.filter((loan) => loan.status === "active").length,
      totalDamageReports: damageReports.length,
    }
  } catch (error) {
    console.error("Error getting detailed stats:", error)
    throw error
  }
}

export const testFirebaseConnection = async () => {
  try {
    const testCollection = collection(db, "test")
    await getDocs(testCollection)
    return true
  } catch (error) {
    console.error("Error de conexión a Firebase:", error)
    return false
  }
}

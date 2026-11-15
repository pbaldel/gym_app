import {
  cleanMachineSettings,
  cleanName,
  type MachineSettingsFields,
} from '../../domain/exerciseForm'
import type { Exercise, ExerciseType, Id, MachineSettings, MuscleGroup } from '../../domain/types'
import { db } from '../schema'

export interface ExerciseInput {
  name: string
  muscleGroup: MuscleGroup
  type: ExerciseType
  notes?: string
}

export function listExercises(): Promise<Exercise[]> {
  return db.exercises.toArray()
}

export function getExercise(id: Id): Promise<Exercise | undefined> {
  return db.exercises.get(id)
}

export function getMachineSettings(exerciseId: Id): Promise<MachineSettings | undefined> {
  return db.machineSettings.get(exerciseId)
}

function normalizeInput(input: ExerciseInput) {
  const notes = input.notes?.trim()
  return {
    name: cleanName(input.name),
    muscleGroup: input.muscleGroup,
    type: input.type,
    notes: notes ? notes : undefined,
  }
}

/**
 * Guarda los ajustes de máquina. Si quedan vacíos (y no hay foto),
 * borra la fila. Debe llamarse dentro de una transacción.
 */
async function writeMachineSettings(exerciseId: Id, fields: MachineSettingsFields, now: number) {
  const clean = cleanMachineSettings(fields)
  const current = await db.machineSettings.get(exerciseId)
  const photoId = current?.photoId

  if (Object.keys(clean).length === 0 && !photoId) {
    if (current) await db.machineSettings.delete(exerciseId)
    return
  }
  await db.machineSettings.put({ exerciseId, updatedAt: now, ...clean, ...(photoId ? { photoId } : {}) })
}

/**
 * Crea un ejercicio y, si se pasan, sus ajustes de máquina, en una sola transacción.
 * Devuelve el id nuevo.
 */
export async function createExercise(
  input: ExerciseInput,
  machine?: MachineSettingsFields,
  now: number = Date.now(),
): Promise<Id> {
  const id = crypto.randomUUID()
  await db.transaction('rw', db.exercises, db.machineSettings, async () => {
    await db.exercises.add({ id, ...normalizeInput(input), archived: 0, createdAt: now, updatedAt: now })
    if (machine) await writeMachineSettings(id, machine, now)
  })
  return id
}

/**
 * Actualiza un ejercicio. `machine` undefined deja los ajustes como están;
 * un objeto los reemplaza (vacío = borrarlos).
 */
export async function updateExercise(
  id: Id,
  input: ExerciseInput,
  machine?: MachineSettingsFields,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.exercises, db.machineSettings, async () => {
    const current = await db.exercises.get(id)
    if (!current) throw new Error(`Ejercicio no encontrado: ${id}`)
    const { notes, ...rest } = normalizeInput(input)
    const next: Exercise = { ...current, ...rest, updatedAt: now }
    if (notes) next.notes = notes
    else delete next.notes
    await db.exercises.put(next)
    if (machine) await writeMachineSettings(id, machine, now)
  })
}

/** Borrado suave: archivar o restaurar. */
export async function setExerciseArchived(id: Id, archived: boolean, now: number = Date.now()): Promise<void> {
  const changed = await db.exercises.update(id, { archived: archived ? 1 : 0, updatedAt: now })
  if (changed === 0) throw new Error(`Ejercicio no encontrado: ${id}`)
}

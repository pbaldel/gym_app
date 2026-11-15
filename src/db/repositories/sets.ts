import Dexie from 'dexie'
import type { Id, WorkoutSet } from '../../domain/types'
import type { SetValues } from '../../domain/workout'
import { db } from '../schema'

export interface NewSet extends SetValues {
  sessionId: Id
  sessionExerciseId: Id
  exerciseId: Id
}

function withValues<T extends object>(base: T, values: SetValues) {
  const { rpe, ...rest } = values
  const next = { ...base, ...rest } as T & SetValues
  if (rpe === undefined) delete next.rpe
  else next.rpe = rpe
  return next
}

/** Guarda una serie al instante. Devuelve su id. */
export async function addSet(input: NewSet, now: number = Date.now()): Promise<Id> {
  const id = crypto.randomUUID()
  await db.transaction('rw', db.sets, async () => {
    const existing = await db.sets.where('sessionExerciseId').equals(input.sessionExerciseId).toArray()
    const order = existing.reduce((max, s) => Math.max(max, s.order), -1) + 1
    const { sessionId, sessionExerciseId, exerciseId, ...values } = input
    await db.sets.add(withValues({ id, sessionId, sessionExerciseId, exerciseId, order, completedAt: now }, values))
  })
  return id
}

/** Cambia peso, reps, RPE o calentamiento. No toca la fecha ni el orden. */
export async function updateSet(id: Id, values: SetValues): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const current = await db.sets.get(id)
    if (!current) throw new Error(`Serie no encontrada: ${id}`)
    await db.sets.put(withValues(current, values))
  })
}

export async function deleteSet(id: Id): Promise<void> {
  await db.sets.delete(id)
}

export function listSetsForSessionExercise(sessionExerciseId: Id): Promise<WorkoutSet[]> {
  return db.sets.where('sessionExerciseId').equals(sessionExerciseId).sortBy('order')
}

export function listSetsForSession(sessionId: Id): Promise<WorkoutSet[]> {
  return db.sets.where('sessionId').equals(sessionId).toArray()
}

/** Todas las series de un ejercicio, de más antigua a más reciente. */
export function listSetsForExercise(exerciseId: Id): Promise<WorkoutSet[]> {
  return db.sets
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .toArray()
}

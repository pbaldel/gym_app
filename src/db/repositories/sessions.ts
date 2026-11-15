import Dexie from 'dexie'
import type { Exercise, Id, MachineSettings, Session, SessionExercise, WorkoutSet } from '../../domain/types'
import { findLastTime, type LastTime, sortSets } from '../../domain/workout'
import { db } from '../schema'
import { listSetsForExercise } from './sets'

// ---------- Sesiones ----------

export function getSession(id: Id): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export function getActiveSession(): Promise<Session | undefined> {
  return db.sessions.where('status').equals('active').first()
}

/** Empieza una sesión. Si ya hay una activa, devuelve esa (solo puede haber una). */
export async function startSession(now: number = Date.now()): Promise<Id> {
  return db.transaction('rw', db.sessions, async () => {
    const active = await db.sessions.where('status').equals('active').first()
    if (active) return active.id
    const id = crypto.randomUUID()
    await db.sessions.add({ id, startedAt: now, status: 'active' })
    return id
  })
}

/**
 * Termina la sesión. Si no tiene ninguna serie, se descarta en lugar de
 * guardarse vacía en el historial.
 */
export async function finishSession(id: Id, now: number = Date.now()): Promise<'finished' | 'discarded'> {
  return db.transaction('rw', db.sessions, db.sessionExercises, db.sets, async () => {
    const setCount = await db.sets.where('sessionId').equals(id).count()
    if (setCount === 0) {
      await db.sessionExercises.where('sessionId').equals(id).delete()
      await db.sessions.delete(id)
      return 'discarded'
    }
    const changed = await db.sessions.update(id, { status: 'done', endedAt: now })
    if (changed === 0) throw new Error(`Sesión no encontrada: ${id}`)
    return 'finished'
  })
}

/** Borra una sesión con sus ejercicios y series. */
export async function deleteSession(id: Id): Promise<void> {
  await db.transaction('rw', db.sessions, db.sessionExercises, db.sets, async () => {
    await db.sets.where('sessionId').equals(id).delete()
    await db.sessionExercises.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
  })
}

/** Sesiones terminadas, de más reciente a más antigua. */
export function listDoneSessions(limit?: number): Promise<Session[]> {
  let query = db.sessions
    .orderBy('startedAt')
    .reverse()
    .filter((s) => s.status === 'done')
  if (limit !== undefined) query = query.limit(limit)
  return query.toArray()
}

// ---------- Ejercicios dentro de la sesión ----------

function sessionExerciseRange(sessionId: Id) {
  return db.sessionExercises
    .where('[sessionId+order]')
    .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
}

/** Añade un ejercicio al final de la sesión. Devuelve el id del bloque. */
export async function addExerciseToSession(sessionId: Id, exerciseId: Id): Promise<Id> {
  const id = crypto.randomUUID()
  await db.transaction('rw', db.sessionExercises, async () => {
    const last = await sessionExerciseRange(sessionId).last()
    await db.sessionExercises.add({ id, sessionId, exerciseId, order: (last?.order ?? -1) + 1 })
  })
  return id
}

/** Quita un ejercicio de la sesión junto con sus series. */
export async function removeSessionExercise(id: Id): Promise<void> {
  await db.transaction('rw', db.sessionExercises, db.sets, async () => {
    await db.sets.where('sessionExerciseId').equals(id).delete()
    await db.sessionExercises.delete(id)
  })
}

/**
 * Ejercicios usados en las últimas sesiones (de más reciente a más antiguo, sin repetir).
 * Sirve para la sección "Recientes" del selector.
 */
export async function listRecentExerciseIds(sessionLimit = 10): Promise<Id[]> {
  const sessions = await db.sessions.orderBy('startedAt').reverse().limit(sessionLimit).toArray()
  const ids: Id[] = []
  for (const s of sessions) {
    const items = await sessionExerciseRange(s.id).reverse().toArray()
    for (const item of items) if (!ids.includes(item.exerciseId)) ids.push(item.exerciseId)
  }
  return ids
}

// ---------- Vistas compuestas para las pantallas ----------

export interface SessionItem {
  sessionExercise: SessionExercise
  /** Puede faltar si los datos se importaron incompletos. */
  exercise: Exercise | undefined
  sets: WorkoutSet[]
}

export interface SessionView {
  session: Session
  items: SessionItem[]
}

/** Sesión con sus ejercicios (en orden) y las series de cada uno. */
export async function getSessionView(sessionId: Id): Promise<SessionView | null> {
  const session = await db.sessions.get(sessionId)
  if (!session) return null
  const [sessionExercises, sets] = await Promise.all([
    sessionExerciseRange(sessionId).toArray(),
    db.sets.where('sessionId').equals(sessionId).toArray(),
  ])
  const exercises = await db.exercises.bulkGet(sessionExercises.map((se) => se.exerciseId))
  return {
    session,
    items: sessionExercises.map((se, i) => ({
      sessionExercise: se,
      exercise: exercises[i],
      sets: sortSets(sets.filter((s) => s.sessionExerciseId === se.id)),
    })),
  }
}

/** Resumen de varias sesiones para listas (Entrenar, Historial). */
export async function getSessionViews(sessions: readonly Session[]): Promise<SessionView[]> {
  const views = await Promise.all(sessions.map((s) => getSessionView(s.id)))
  return views.filter((v): v is SessionView => v !== null)
}

export interface LogView {
  session: Session
  sessionExercise: SessionExercise
  exercise: Exercise
  machineSettings: MachineSettings | undefined
  /** Series de este bloque, en orden. */
  sets: WorkoutSet[]
  lastTime: LastTime | null
}

/** Todo lo que necesita la pantalla de registro de un ejercicio. */
export async function getLogView(sessionExerciseId: Id): Promise<LogView | null> {
  const sessionExercise = await db.sessionExercises.get(sessionExerciseId)
  if (!sessionExercise) return null
  const [session, exercise, machineSettings, exerciseSets] = await Promise.all([
    db.sessions.get(sessionExercise.sessionId),
    db.exercises.get(sessionExercise.exerciseId),
    db.machineSettings.get(sessionExercise.exerciseId),
    listSetsForExercise(sessionExercise.exerciseId),
  ])
  if (!session || !exercise) return null

  const sessionIds = [...new Set(exerciseSets.map((s) => s.sessionId))]
  const sessions = await db.sessions.bulkGet(sessionIds)
  const sessionMap = new Map<Id, Session>()
  for (const s of sessions) if (s) sessionMap.set(s.id, s)

  return {
    session,
    sessionExercise,
    exercise,
    machineSettings,
    sets: sortSets(exerciseSets.filter((s) => s.sessionExerciseId === sessionExerciseId)),
    lastTime: findLastTime(exerciseSets, sessionMap, { sessionId: session.id, sessionExerciseId }),
  }
}

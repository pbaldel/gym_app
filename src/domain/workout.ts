import type { ExerciseType, Id, Session, WorkoutSet } from './types'

/** Valores de RPE que se ofrecen como chips (además de "sin RPE"). */
export const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const

/** Paso fino de peso con pulsación larga. */
export const FINE_WEIGHT_STEP = 1.25

/** Valores editables de una serie. */
export interface SetValues {
  weight: number
  reps: number
  rpe?: number
  isWarmup: boolean
}

/** Series que cuentan para récords y volumen (sin calentamiento). */
export function effectiveSets<T extends Pick<WorkoutSet, 'isWarmup'>>(sets: readonly T[]): T[] {
  return sets.filter((s) => !s.isWarmup)
}

/** Orden natural de las series de un ejercicio. */
export function sortSets<T extends Pick<WorkoutSet, 'order' | 'completedAt'>>(sets: readonly T[]): T[] {
  return [...sets].sort((a, b) => a.order - b.order || a.completedAt - b.completedAt)
}

/** Redondea a 2 decimales para evitar 0.1 + 0.2 = 0.30000000000000004. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Suma `delta` sin bajar de `min` y sin arrastrar errores de coma flotante. */
export function stepValue(value: number, delta: number, min = 0): number {
  return Math.max(min, round2(value + delta))
}

/**
 * Valores con los que se precarga el panel de entrada:
 * la última serie de hoy o, si no hay, la primera serie efectiva de la última vez
 * (o la primera de calentamiento si no hubo efectivas).
 */
export function prefillValues(
  todaySets: readonly WorkoutSet[],
  lastTimeSets: readonly WorkoutSet[],
  type: ExerciseType,
): Pick<SetValues, 'weight' | 'reps'> {
  const today = sortSets(todaySets)
  const lastToday = today[today.length - 1]
  if (lastToday) return { weight: lastToday.weight, reps: lastToday.reps }

  const previous = sortSets(lastTimeSets)
  const reference = effectiveSets(previous)[0] ?? previous[0]
  if (reference) return { weight: reference.weight, reps: reference.reps }

  return { weight: type === 'peso_corporal' ? 0 : 20, reps: 8 }
}

export interface LastTime {
  sessionId: Id
  sessionExerciseId: Id
  /** Momento de la última serie de ese bloque. */
  date: number
  sets: WorkoutSet[]
}

/**
 * "Última vez" para un ejercicio: el bloque (sessionExercise) más reciente con ese
 * ejercicio, sin contar el que se está registrando. Vale una sesión terminada o
 * la sesión actual, si el ejercicio ya se hizo antes en ella.
 *
 * `sets` son todas las series de ese ejercicio; `sessions` las sesiones a las que pertenecen.
 */
export function findLastTime(
  sets: readonly WorkoutSet[],
  sessions: ReadonlyMap<Id, Session>,
  current: { sessionId: Id; sessionExerciseId: Id },
): LastTime | null {
  let latest: WorkoutSet | undefined
  for (const s of sets) {
    if (s.sessionExerciseId === current.sessionExerciseId) continue
    const session = sessions.get(s.sessionId)
    if (!session) continue
    if (session.status !== 'done' && s.sessionId !== current.sessionId) continue
    if (!latest || s.completedAt > latest.completedAt) latest = s
  }
  if (!latest) return null

  const block = sortSets(sets.filter((s) => s.sessionExerciseId === latest.sessionExerciseId))
  return {
    sessionId: latest.sessionId,
    sessionExerciseId: latest.sessionExerciseId,
    date: latest.completedAt,
    sets: block,
  }
}

/** Milisegundos que faltan para `endsAt` (nunca negativo). */
export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now)
}

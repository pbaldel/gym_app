import { useLiveQuery } from 'dexie-react-hooks'
import type { Exercise, Id, MachineSettings, Session, SettingsMap } from '../domain/types'
import { getExercise, getMachineSettings, listExercises } from './repositories/exercises'
import {
  getActiveSession,
  getLogView,
  getSessionView,
  getSessionViews,
  type LogView,
  listDoneSessions,
  listRecentExerciseIds,
  type SessionView,
} from './repositories/sessions'
import { getSettings } from './repositories/settings'

// Hooks reactivos para los componentes. `undefined` = cargando;
// `null` = no existe.

export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(listExercises, [])
}

export function useExercise(id: Id | undefined): Exercise | null | undefined {
  return useLiveQuery(async () => (id ? ((await getExercise(id)) ?? null) : null), [id])
}

export function useMachineSettings(exerciseId: Id | undefined): MachineSettings | null | undefined {
  return useLiveQuery(
    async () => (exerciseId ? ((await getMachineSettings(exerciseId)) ?? null) : null),
    [exerciseId],
  )
}

export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(async () => (await getActiveSession()) ?? null, [])
}

export function useSessionView(sessionId: Id | undefined): SessionView | null | undefined {
  return useLiveQuery(async () => (sessionId ? getSessionView(sessionId) : null), [sessionId])
}

/** Sesiones terminadas con sus ejercicios y series. */
export function useDoneSessionViews(limit?: number): SessionView[] | undefined {
  return useLiveQuery(async () => getSessionViews(await listDoneSessions(limit)), [limit])
}

export function useLogView(sessionExerciseId: Id | undefined): LogView | null | undefined {
  return useLiveQuery(async () => (sessionExerciseId ? getLogView(sessionExerciseId) : null), [sessionExerciseId])
}

export function useRecentExerciseIds(): Id[] | undefined {
  return useLiveQuery(() => listRecentExerciseIds(), [])
}

export function useSettings(): SettingsMap | undefined {
  return useLiveQuery(getSettings, [])
}

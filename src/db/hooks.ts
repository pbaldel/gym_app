import { useLiveQuery } from 'dexie-react-hooks'
import type { Exercise, Id, MachineSettings } from '../domain/types'
import { getExercise, getMachineSettings, listExercises } from './repositories/exercises'

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

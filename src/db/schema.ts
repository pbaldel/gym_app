import Dexie, { type EntityTable } from 'dexie'
import type {
  Exercise,
  MachineSettings,
  Photo,
  Session,
  SessionExercise,
  SettingRow,
  WorkoutSet,
} from '../domain/types'

export const DB_NAME = 'gym-log'
export const SCHEMA_VERSION = 1

export type GymDb = Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  machineSettings: EntityTable<MachineSettings, 'exerciseId'>
  photos: EntityTable<Photo, 'id'>
  sessions: EntityTable<Session, 'id'>
  sessionExercises: EntityTable<SessionExercise, 'id'>
  sets: EntityTable<WorkoutSet, 'id'>
  settings: EntityTable<SettingRow, 'key'>
}

export const db = new Dexie(DB_NAME) as GymDb

// Versión 1. Los cambios de esquema van en db.version(n).upgrade(...),
// nunca editando esta declaración.
db.version(1).stores({
  exercises: 'id, name, muscleGroup, type, archived',
  machineSettings: 'exerciseId',
  photos: 'id',
  sessions: 'id, startedAt, status',
  sessionExercises: 'id, sessionId, exerciseId, [sessionId+order]',
  sets: 'id, sessionExerciseId, sessionId, [exerciseId+completedAt]',
  settings: 'key',
})

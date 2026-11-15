// Tipos del modelo de datos (ver CLAUDE.md, "Modelo de datos").
// Ids: crypto.randomUUID(). Fechas: epoch ms. Peso: kg con decimales.

export type Id = string
export type EpochMs = number

export const MUSCLE_GROUPS = [
  'pecho',
  'espalda',
  'hombro',
  'biceps',
  'triceps',
  'cuadriceps',
  'isquios',
  'gluteo',
  'gemelo',
  'core',
  'antebrazo',
  'otro',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const EXERCISE_TYPES = ['maquina', 'peso_libre', 'polea', 'peso_corporal'] as const
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

export interface Exercise {
  id: Id
  name: string
  muscleGroup: MuscleGroup
  type: ExerciseType
  /**
   * Borrado suave: los archivados se ocultan del catálogo.
   * 0/1 en lugar de boolean porque IndexedDB no indexa booleanos
   * y el índice `archived` quedaría vacío.
   */
  archived: 0 | 1
  createdAt: EpochMs
  updatedAt: EpochMs
  notes?: string
}

/** Ajustes de máquina, 1:1 con el ejercicio. Campos de texto libre. */
export interface MachineSettings {
  exerciseId: Id
  updatedAt: EpochMs
  seat?: string
  backrest?: string
  rollers?: string
  grip?: string
  notes?: string
  photoId?: Id
}

export interface Photo {
  id: Id
  createdAt: EpochMs
  blob: Blob
  width: number
  height: number
  bytes: number
}

export type SessionStatus = 'active' | 'done'

export interface Session {
  id: Id
  startedAt: EpochMs
  endedAt?: EpochMs
  status: SessionStatus
  notes?: string
}

/** Un ejercicio dentro de una sesión (puede repetirse). */
export interface SessionExercise {
  id: Id
  sessionId: Id
  exerciseId: Id
  order: number
  notes?: string
}

export interface WorkoutSet {
  id: Id
  sessionId: Id
  sessionExerciseId: Id
  exerciseId: Id
  order: number
  completedAt: EpochMs
  /** En `peso_corporal` es el lastre extra (0 = solo peso corporal). */
  weight: number
  reps: number
  /** 6–10, de 0,5 en 0,5. */
  rpe?: number
  /** Las series de calentamiento no cuentan para récords ni volumen. */
  isWarmup: boolean
}

export type ThemeSetting = 'dark' | 'light' | 'system'

/** Valores de la tabla `settings`, indexados por clave. */
export interface SettingsMap {
  theme: ThemeSetting
  defaultRestSec: number
  weightStep: number
  lastBackupAt: EpochMs | null
  schemaVersion: number
}
export type SettingKey = keyof SettingsMap

export interface SettingRow<K extends SettingKey = SettingKey> {
  key: K
  value: SettingsMap[K]
}

export const DEFAULT_SETTINGS: SettingsMap = {
  theme: 'dark',
  defaultRestSec: 120,
  weightStep: 2.5,
  lastBackupAt: null,
  schemaVersion: 1,
}

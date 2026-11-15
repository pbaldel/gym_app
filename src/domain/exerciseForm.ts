import { normalizeText } from './search'
import type { Exercise, ExerciseType, Id, MachineSettings, MuscleGroup } from './types'

export const NAME_MAX_LENGTH = 60

/** Estado editable del formulario de ejercicio. */
export interface ExerciseDraft {
  name: string
  muscleGroup: MuscleGroup | null
  type: ExerciseType | null
  notes: string
}

export type ExerciseDraftErrors = Partial<Record<'name' | 'muscleGroup' | 'type', string>>

export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

/** Solo las máquinas y las poleas tienen ajustes (asiento, respaldo...). */
export function usesMachineSettings(type: ExerciseType | null): boolean {
  return type === 'maquina' || type === 'polea'
}

/**
 * Valida el borrador. `existing` es el catálogo completo (incluidos archivados)
 * para detectar nombres repetidos; `editingId` excluye el propio ejercicio.
 */
export function validateExerciseDraft(
  draft: ExerciseDraft,
  existing: readonly Exercise[],
  editingId?: Id,
): ExerciseDraftErrors {
  const errors: ExerciseDraftErrors = {}
  const name = cleanName(draft.name)

  if (name === '') {
    errors.name = 'Escribe un nombre'
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Máximo ${NAME_MAX_LENGTH} caracteres`
  } else {
    const key = normalizeText(name)
    const duplicate = existing.find((e) => e.id !== editingId && normalizeText(e.name) === key)
    if (duplicate) {
      errors.name = duplicate.archived
        ? 'Ya existe un ejercicio archivado con ese nombre'
        : 'Ya existe un ejercicio con ese nombre'
    }
  }

  if (draft.muscleGroup === null) errors.muscleGroup = 'Elige un grupo muscular'
  if (draft.type === null) errors.type = 'Elige un tipo'
  return errors
}

export function hasErrors(errors: ExerciseDraftErrors): boolean {
  return Object.keys(errors).length > 0
}

/** Campos de texto de los ajustes de máquina. */
export const MACHINE_FIELDS = ['seat', 'backrest', 'rollers', 'grip', 'notes'] as const
export type MachineField = (typeof MACHINE_FIELDS)[number]
export type MachineSettingsFields = Partial<Pick<MachineSettings, MachineField>>

/** Recorta los campos y elimina los vacíos. */
export function cleanMachineSettings(fields: MachineSettingsFields): MachineSettingsFields {
  const clean: MachineSettingsFields = {}
  for (const key of MACHINE_FIELDS) {
    const value = fields[key]?.trim()
    if (value) clean[key] = value
  }
  return clean
}

export function isEmptyMachineSettings(fields: MachineSettingsFields): boolean {
  return Object.keys(cleanMachineSettings(fields)).length === 0
}

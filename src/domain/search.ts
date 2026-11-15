import type { Exercise, ExerciseType, MuscleGroup } from './types'

/** Minúsculas, sin tildes ni diéresis y con los espacios colapsados. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Todas las palabras de la búsqueda deben aparecer en el texto, en cualquier orden. */
export function matchesQuery(text: string, query: string): boolean {
  const words = normalizeText(query).split(' ').filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalizeText(text)
  return words.every((word) => haystack.includes(word))
}

export interface ExerciseFilter {
  query: string
  muscleGroup: MuscleGroup | null
  type: ExerciseType | null
  /** true: solo archivados; false: solo activos. */
  archived: boolean
}

export const EMPTY_FILTER: ExerciseFilter = {
  query: '',
  muscleGroup: null,
  type: null,
  archived: false,
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

export function compareByName(a: Exercise, b: Exercise): number {
  return collator.compare(a.name, b.name)
}

/** Filtra y ordena alfabéticamente el catálogo. */
export function filterExercises(exercises: readonly Exercise[], filter: ExerciseFilter): Exercise[] {
  const wantArchived = filter.archived ? 1 : 0
  return exercises
    .filter(
      (e) =>
        e.archived === wantArchived &&
        (filter.muscleGroup === null || e.muscleGroup === filter.muscleGroup) &&
        (filter.type === null || e.type === filter.type) &&
        matchesQuery(e.name, filter.query),
    )
    .sort(compareByName)
}

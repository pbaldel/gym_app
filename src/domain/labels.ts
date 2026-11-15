import type { ExerciseType, MuscleGroup } from './types'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro: 'Hombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps',
  isquios: 'Isquios',
  gluteo: 'Glúteo',
  gemelo: 'Gemelo',
  core: 'Core',
  antebrazo: 'Antebrazo',
  otro: 'Otro',
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  maquina: 'Máquina',
  peso_libre: 'Peso libre',
  polea: 'Polea',
  peso_corporal: 'Peso corporal',
}

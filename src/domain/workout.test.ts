import { describe, expect, it } from 'vitest'
import type { Session, WorkoutSet } from './types'
import { effectiveSets, findLastTime, prefillValues, remainingMs, sortSets, stepValue } from './workout'

let n = 0
const set = (extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `s${++n}`,
  sessionId: 'A',
  sessionExerciseId: 'A1',
  exerciseId: 'ex',
  order: 0,
  completedAt: 0,
  weight: 60,
  reps: 8,
  isWarmup: false,
  ...extra,
})

const session = (id: string, status: Session['status']): Session => ({ id, startedAt: 0, status })

describe('stepValue', () => {
  it('suma sin errores de coma flotante', () => {
    expect(stepValue(0.1, 0.2)).toBe(0.3)
    expect(stepValue(60, 1.25)).toBe(61.25)
    expect(stepValue(61.25, -2.5)).toBe(58.75)
  })

  it('no baja del mínimo', () => {
    expect(stepValue(1, -2.5)).toBe(0)
    expect(stepValue(1, -2, 1)).toBe(1)
  })
})

describe('sortSets y effectiveSets', () => {
  it('ordena por order y luego por fecha', () => {
    const a = set({ order: 1, completedAt: 5 })
    const b = set({ order: 0, completedAt: 9 })
    const c = set({ order: 1, completedAt: 3 })
    expect(sortSets([a, b, c])).toEqual([b, c, a])
  })

  it('descarta calentamientos', () => {
    expect(effectiveSets([set({ isWarmup: true }), set()])).toHaveLength(1)
  })
})

describe('prefillValues', () => {
  it('usa la última serie de hoy', () => {
    const today = [set({ order: 0, weight: 60 }), set({ order: 1, weight: 62.5, reps: 6 })]
    expect(prefillValues(today, [set({ weight: 99 })], 'maquina')).toEqual({ weight: 62.5, reps: 6 })
  })

  it('si no hay series hoy, la primera efectiva de la última vez', () => {
    const last = [
      set({ order: 0, weight: 40, isWarmup: true }),
      set({ order: 1, weight: 70, reps: 5 }),
      set({ order: 2, weight: 75, reps: 3 }),
    ]
    expect(prefillValues([], last, 'peso_libre')).toEqual({ weight: 70, reps: 5 })
  })

  it('si la última vez solo hubo calentamiento, usa ese', () => {
    expect(prefillValues([], [set({ weight: 40, isWarmup: true })], 'maquina')).toEqual({ weight: 40, reps: 8 })
  })

  it('sin historial: 20 kg o 0 de lastre en peso corporal', () => {
    expect(prefillValues([], [], 'maquina')).toEqual({ weight: 20, reps: 8 })
    expect(prefillValues([], [], 'peso_corporal')).toEqual({ weight: 0, reps: 8 })
  })
})

describe('findLastTime', () => {
  const current = { sessionId: 'C', sessionExerciseId: 'C1' }

  it('devuelve el bloque más reciente de una sesión terminada, ordenado', () => {
    const sessions = new Map([
      ['A', session('A', 'done')],
      ['B', session('B', 'done')],
      ['C', session('C', 'active')],
    ])
    const sets = [
      set({ sessionId: 'A', sessionExerciseId: 'A1', completedAt: 100 }),
      set({ sessionId: 'B', sessionExerciseId: 'B1', order: 1, completedAt: 210, weight: 65 }),
      set({ sessionId: 'B', sessionExerciseId: 'B1', order: 0, completedAt: 200, weight: 60 }),
      set({ sessionId: 'C', sessionExerciseId: 'C1', completedAt: 300 }),
    ]
    const last = findLastTime(sets, sessions, current)
    expect(last?.sessionId).toBe('B')
    expect(last?.date).toBe(210)
    expect(last?.sets.map((s) => s.weight)).toEqual([60, 65])
  })

  it('cuenta un bloque anterior del mismo ejercicio en la sesión actual', () => {
    const sessions = new Map([
      ['A', session('A', 'done')],
      ['C', session('C', 'active')],
    ])
    const sets = [
      set({ sessionId: 'A', sessionExerciseId: 'A1', completedAt: 100 }),
      set({ sessionId: 'C', sessionExerciseId: 'C0', completedAt: 250, weight: 50 }),
    ]
    expect(findLastTime(sets, sessions, current)?.sessionExerciseId).toBe('C0')
  })

  it('ignora sesiones activas ajenas o desconocidas', () => {
    const sessions = new Map([['X', session('X', 'active')]])
    const sets = [set({ sessionId: 'X', sessionExerciseId: 'X1' }), set({ sessionId: 'Z', sessionExerciseId: 'Z1' })]
    expect(findLastTime(sets, sessions, current)).toBeNull()
  })
})

describe('remainingMs', () => {
  it('nunca es negativo', () => {
    expect(remainingMs(1000, 400)).toBe(600)
    expect(remainingMs(1000, 4000)).toBe(0)
  })
})

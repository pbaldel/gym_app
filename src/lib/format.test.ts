import { describe, expect, it } from 'vitest'
import type { WorkoutSet } from '../domain/types'
import {
  formatCountdown,
  formatDuration,
  formatRelativeDay,
  formatSet,
  formatWeight,
  parseDecimal,
  summarizeSets,
} from './format'

const set = (weight: number, reps: number, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 'x',
  sessionId: 's',
  sessionExerciseId: 'se',
  exerciseId: 'e',
  order: 0,
  completedAt: 0,
  weight,
  reps,
  isWarmup: false,
  ...extra,
})

describe('peso', () => {
  it('formatea con coma decimal y sin ceros sobrantes', () => {
    expect(formatWeight(62.5)).toBe('62,5')
    expect(formatWeight(60)).toBe('60')
    expect(formatWeight(1.25)).toBe('1,25')
    expect(formatWeight(1000)).toBe('1000')
  })

  it('parsea coma o punto y rechaza basura', () => {
    expect(parseDecimal('62,5')).toBe(62.5)
    expect(parseDecimal(' 61.25 ')).toBe(61.25)
    expect(parseDecimal('60')).toBe(60)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('-5')).toBeNull()
    expect(parseDecimal('1,2,3')).toBeNull()
  })
})

describe('formatSet', () => {
  it('peso × reps con RPE opcional', () => {
    expect(formatSet(set(60, 8))).toBe('60×8')
    expect(formatSet(set(62.5, 6, { rpe: 9 }))).toBe('62,5×6 (RPE 9)')
    expect(formatSet(set(60, 8, { rpe: 8.5 }))).toBe('60×8 (RPE 8,5)')
  })

  it('peso corporal: lastre con + o solo reps', () => {
    expect(formatSet(set(0, 12), 'peso_corporal')).toBe('×12')
    expect(formatSet(set(10, 8), 'peso_corporal')).toBe('+10×8')
  })
})

describe('summarizeSets', () => {
  it('series iguales: "3 × 8 @ 60 kg"', () => {
    expect(summarizeSets([set(60, 8), set(60, 8), set(60, 8)], 'maquina')).toBe('3 × 8 @ 60 kg')
  })

  it('ignora el calentamiento', () => {
    expect(summarizeSets([set(40, 10, { isWarmup: true }), set(60, 8)], 'maquina')).toBe('1 × 8 @ 60 kg')
    expect(summarizeSets([set(40, 10, { isWarmup: true })], 'maquina')).toBe('1 de calentamiento')
  })

  it('rangos cuando varían', () => {
    expect(summarizeSets([set(60, 8), set(62.5, 6)], 'maquina')).toBe('2 series · 60–62,5 kg')
    expect(summarizeSets([set(60, 8), set(60, 6)], 'maquina')).toBe('2 series · 60 kg')
  })

  it('peso corporal', () => {
    expect(summarizeSets([set(0, 12), set(0, 12)], 'peso_corporal')).toBe('2 × 12')
    expect(summarizeSets([set(0, 12), set(0, 10)], 'peso_corporal')).toBe('2 series · 10–12 reps')
    expect(summarizeSets([set(10, 8)], 'peso_corporal')).toBe('1 × 8 @ +10 kg')
  })

  it('sin series', () => {
    expect(summarizeSets([], 'maquina')).toBe('Sin series')
  })
})

describe('fechas y tiempos', () => {
  const now = new Date(2026, 10, 15, 10, 0).getTime()
  const daysAgo = (d: number, hour = 20) => new Date(2026, 10, 15 - d, hour, 0).getTime()

  it('fecha relativa por días naturales', () => {
    expect(formatRelativeDay(daysAgo(0, 7), now)).toBe('hoy')
    expect(formatRelativeDay(daysAgo(1, 23), now)).toBe('ayer')
    expect(formatRelativeDay(daysAgo(4), now)).toBe('hace 4 días')
    expect(formatRelativeDay(daysAgo(7), now)).toBe('hace 1 semana')
    expect(formatRelativeDay(daysAgo(20), now)).toBe('hace 2 semanas')
    expect(formatRelativeDay(new Date(2026, 2, 12).getTime(), now)).toBe('12 mar')
    expect(formatRelativeDay(new Date(2025, 2, 12).getTime(), now)).toBe('12 mar 2025')
  })

  it('duraciones y cuenta atrás', () => {
    expect(formatDuration(45 * 60_000)).toBe('45 min')
    expect(formatDuration(65 * 60_000)).toBe('1 h 05 min')
    expect(formatCountdown(90_000)).toBe('1:30')
    expect(formatCountdown(500)).toBe('0:01')
    expect(formatCountdown(0)).toBe('0:00')
  })
})

import { describe, expect, it } from 'vitest'
import { EMPTY_FILTER, filterExercises, matchesQuery, normalizeText } from './search'
import type { Exercise } from './types'

const ex = (name: string, extra: Partial<Exercise> = {}): Exercise => ({
  id: name,
  name,
  muscleGroup: 'pecho',
  type: 'maquina',
  archived: 0,
  createdAt: 0,
  updatedAt: 0,
  ...extra,
})

describe('normalizeText', () => {
  it('quita tildes, diéresis y mayúsculas', () => {
    expect(normalizeText('Bíceps CUÁDRICEPS pingüino')).toBe('biceps cuadriceps pinguino')
  })

  it('colapsa espacios', () => {
    expect(normalizeText('  press   banca ')).toBe('press banca')
  })
})

describe('matchesQuery', () => {
  it('encuentra sin tildes ni mayúsculas', () => {
    expect(matchesQuery('Curl de bíceps', 'BICEPS')).toBe(true)
  })

  it('exige todas las palabras en cualquier orden', () => {
    expect(matchesQuery('Press banca inclinado', 'inclinado press')).toBe(true)
    expect(matchesQuery('Press banca inclinado', 'press militar')).toBe(false)
  })

  it('una búsqueda vacía lo acepta todo', () => {
    expect(matchesQuery('Lo que sea', '   ')).toBe(true)
  })
})

describe('filterExercises', () => {
  const list = [
    ex('Remo en polea', { muscleGroup: 'espalda', type: 'polea' }),
    ex('press banca', { type: 'peso_libre' }),
    ex('Aperturas'),
    ex('Jalón', { muscleGroup: 'espalda', archived: 1 }),
  ]

  it('oculta archivados y ordena alfabéticamente sin distinguir mayúsculas', () => {
    expect(filterExercises(list, EMPTY_FILTER).map((e) => e.name)).toEqual([
      'Aperturas',
      'press banca',
      'Remo en polea',
    ])
  })

  it('muestra solo archivados si se pide', () => {
    expect(filterExercises(list, { ...EMPTY_FILTER, archived: true }).map((e) => e.name)).toEqual(['Jalón'])
  })

  it('combina grupo, tipo y texto', () => {
    expect(filterExercises(list, { ...EMPTY_FILTER, muscleGroup: 'espalda' }).map((e) => e.name)).toEqual([
      'Remo en polea',
    ])
    expect(filterExercises(list, { ...EMPTY_FILTER, type: 'maquina' }).map((e) => e.name)).toEqual(['Aperturas'])
    expect(filterExercises(list, { ...EMPTY_FILTER, muscleGroup: 'pecho', query: 'banca' })).toHaveLength(1)
  })

  it('no modifica la lista original', () => {
    const copy = [...list]
    filterExercises(list, EMPTY_FILTER)
    expect(list).toEqual(copy)
  })
})

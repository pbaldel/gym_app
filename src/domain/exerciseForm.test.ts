import { describe, expect, it } from 'vitest'
import {
  cleanMachineSettings,
  cleanName,
  type ExerciseDraft,
  hasErrors,
  isEmptyMachineSettings,
  NAME_MAX_LENGTH,
  usesMachineSettings,
  validateExerciseDraft,
} from './exerciseForm'
import type { Exercise } from './types'

const draft = (extra: Partial<ExerciseDraft> = {}): ExerciseDraft => ({
  name: 'Prensa',
  muscleGroup: 'cuadriceps',
  type: 'maquina',
  notes: '',
  ...extra,
})

const existing: Exercise[] = [
  {
    id: 'a',
    name: 'Press de banca',
    muscleGroup: 'pecho',
    type: 'peso_libre',
    archived: 0,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'b',
    name: 'Jalón al pecho',
    muscleGroup: 'espalda',
    type: 'polea',
    archived: 1,
    createdAt: 0,
    updatedAt: 0,
  },
]

describe('validateExerciseDraft', () => {
  it('acepta un borrador completo', () => {
    expect(validateExerciseDraft(draft(), existing)).toEqual({})
  })

  it('exige nombre, grupo y tipo', () => {
    const errors = validateExerciseDraft(draft({ name: '   ', muscleGroup: null, type: null }), existing)
    expect(Object.keys(errors).sort()).toEqual(['muscleGroup', 'name', 'type'])
    expect(hasErrors(errors)).toBe(true)
  })

  it('limita la longitud del nombre', () => {
    expect(validateExerciseDraft(draft({ name: 'x'.repeat(NAME_MAX_LENGTH + 1) }), existing).name).toBeDefined()
    expect(validateExerciseDraft(draft({ name: 'x'.repeat(NAME_MAX_LENGTH) }), existing).name).toBeUndefined()
  })

  it('detecta duplicados sin distinguir tildes, mayúsculas ni espacios', () => {
    expect(validateExerciseDraft(draft({ name: ' press  DE banca ' }), existing).name).toBe(
      'Ya existe un ejercicio con ese nombre',
    )
  })

  it('avisa si el duplicado está archivado', () => {
    expect(validateExerciseDraft(draft({ name: 'jalon al pecho' }), existing).name).toBe(
      'Ya existe un ejercicio archivado con ese nombre',
    )
  })

  it('no se considera duplicado de sí mismo al editar', () => {
    expect(validateExerciseDraft(draft({ name: 'Press de banca' }), existing, 'a')).toEqual({})
  })
})

describe('helpers', () => {
  it('cleanName recorta y colapsa espacios', () => {
    expect(cleanName('  Remo   con  barra ')).toBe('Remo con barra')
  })

  it('usesMachineSettings solo para máquina y polea', () => {
    expect(usesMachineSettings('maquina')).toBe(true)
    expect(usesMachineSettings('polea')).toBe(true)
    expect(usesMachineSettings('peso_libre')).toBe(false)
    expect(usesMachineSettings('peso_corporal')).toBe(false)
    expect(usesMachineSettings(null)).toBe(false)
  })

  it('cleanMachineSettings recorta y descarta vacíos', () => {
    expect(cleanMachineSettings({ seat: ' 4 ', backrest: '  ', grip: 'neutro' })).toEqual({
      seat: '4',
      grip: 'neutro',
    })
    expect(isEmptyMachineSettings({ seat: ' ', notes: '' })).toBe(true)
    expect(isEmptyMachineSettings({ rollers: '2' })).toBe(false)
  })
})

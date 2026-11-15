import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../schema'
import {
  createExercise,
  getExercise,
  getMachineSettings,
  listExercises,
  setExerciseArchived,
  updateExercise,
} from './exercises'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const base = { name: '  Prensa   inclinada ', muscleGroup: 'cuadriceps', type: 'maquina' } as const

describe('repositorio de ejercicios', () => {
  it('crea un ejercicio activo con id, fechas y nombre limpio', async () => {
    const id = await createExercise(base, undefined, 1000)
    const ex = await getExercise(id)
    expect(ex).toEqual({
      id,
      name: 'Prensa inclinada',
      muscleGroup: 'cuadriceps',
      type: 'maquina',
      archived: 0,
      createdAt: 1000,
      updatedAt: 1000,
    })
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('guarda los ajustes de máquina en la misma operación, sin campos vacíos', async () => {
    const id = await createExercise(base, { seat: ' 4 ', backrest: '', grip: 'neutro' }, 1000)
    expect(await getMachineSettings(id)).toEqual({ exerciseId: id, updatedAt: 1000, seat: '4', grip: 'neutro' })
  })

  it('no crea fila de ajustes si todos están vacíos', async () => {
    const id = await createExercise(base, { seat: ' ' })
    expect(await getMachineSettings(id)).toBeUndefined()
  })

  it('actualiza datos y notas, y borra los ajustes si se vacían', async () => {
    const id = await createExercise({ ...base, notes: 'pies altos' }, { seat: '4' }, 1000)
    await updateExercise(id, { name: 'Prensa', muscleGroup: 'gluteo', type: 'maquina', notes: ' ' }, {}, 2000)

    const ex = await getExercise(id)
    expect(ex).toMatchObject({ name: 'Prensa', muscleGroup: 'gluteo', createdAt: 1000, updatedAt: 2000 })
    expect(ex).not.toHaveProperty('notes')
    expect(await getMachineSettings(id)).toBeUndefined()
  })

  it('sin `machine` deja los ajustes intactos', async () => {
    const id = await createExercise(base, { seat: '4' }, 1000)
    await updateExercise(id, { ...base, type: 'peso_libre' }, undefined, 2000)
    expect(await getMachineSettings(id)).toMatchObject({ seat: '4', updatedAt: 1000 })
  })

  it('conserva la foto al vaciar los campos de texto', async () => {
    const id = await createExercise(base, { seat: '4' }, 1000)
    await db.machineSettings.update(id, { photoId: 'foto-1' })
    await updateExercise(id, base, {}, 2000)
    expect(await getMachineSettings(id)).toEqual({ exerciseId: id, updatedAt: 2000, photoId: 'foto-1' })
  })

  it('archiva y restaura (borrado suave)', async () => {
    const id = await createExercise(base, undefined, 1000)
    await setExerciseArchived(id, true, 2000)
    expect(await getExercise(id)).toMatchObject({ archived: 1, updatedAt: 2000 })
    expect(await db.exercises.where('archived').equals(1).count()).toBe(1)

    await setExerciseArchived(id, false, 3000)
    expect(await getExercise(id)).toMatchObject({ archived: 0 })
    expect(await listExercises()).toHaveLength(1)
  })

  it('falla al actualizar o archivar un id inexistente', async () => {
    await expect(updateExercise('nope', base)).rejects.toThrow()
    await expect(setExerciseArchived('nope', true)).rejects.toThrow()
  })
})

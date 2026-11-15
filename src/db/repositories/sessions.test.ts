import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../schema'
import { createExercise } from './exercises'
import {
  addExerciseToSession,
  deleteSession,
  finishSession,
  getActiveSession,
  getLogView,
  getSessionView,
  listDoneSessions,
  listRecentExerciseIds,
  removeSessionExercise,
  startSession,
} from './sessions'
import { addSet, deleteSet, listSetsForSessionExercise, updateSet } from './sets'
import { getSettings, setSetting } from './settings'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const exercise = (name: string) => createExercise({ name, muscleGroup: 'pecho', type: 'maquina' })
const values = { weight: 60, reps: 8, isWarmup: false }

describe('sesiones', () => {
  it('solo hay una sesión activa a la vez', async () => {
    const a = await startSession(1000)
    const b = await startSession(2000)
    expect(b).toBe(a)
    expect((await getActiveSession())?.startedAt).toBe(1000)
  })

  it('terminar guarda la hora y deja de estar activa', async () => {
    const sid = await startSession(1000)
    const se = await addExerciseToSession(sid, await exercise('Press'))
    await addSet({ sessionId: sid, sessionExerciseId: se, exerciseId: 'x', ...values })

    expect(await finishSession(sid, 5000)).toBe('finished')
    expect(await getActiveSession()).toBeUndefined()
    expect((await listDoneSessions()).map((s) => s.endedAt)).toEqual([5000])
  })

  it('terminar una sesión sin series la descarta', async () => {
    const sid = await startSession()
    await addExerciseToSession(sid, await exercise('Press'))
    expect(await finishSession(sid)).toBe('discarded')
    expect(await db.sessions.count()).toBe(0)
    expect(await db.sessionExercises.count()).toBe(0)
  })

  it('borrar una sesión borra sus ejercicios y series', async () => {
    const sid = await startSession()
    const se = await addExerciseToSession(sid, await exercise('Press'))
    await addSet({ sessionId: sid, sessionExerciseId: se, exerciseId: 'x', ...values })
    await deleteSession(sid)
    expect([await db.sessions.count(), await db.sessionExercises.count(), await db.sets.count()]).toEqual([0, 0, 0])
  })

  it('los ejercicios se añaden en orden y se pueden repetir', async () => {
    const sid = await startSession()
    const press = await exercise('Press')
    const remo = await exercise('Remo')
    await addExerciseToSession(sid, press)
    await addExerciseToSession(sid, remo)
    await addExerciseToSession(sid, press)
    const view = await getSessionView(sid)
    expect(view?.items.map((i) => [i.sessionExercise.order, i.exercise?.name])).toEqual([
      [0, 'Press'],
      [1, 'Remo'],
      [2, 'Press'],
    ])
  })

  it('quitar un ejercicio borra también sus series', async () => {
    const sid = await startSession()
    const se = await addExerciseToSession(sid, await exercise('Press'))
    await addSet({ sessionId: sid, sessionExerciseId: se, exerciseId: 'x', ...values })
    await removeSessionExercise(se)
    expect(await db.sets.count()).toBe(0)
    expect((await getSessionView(sid))?.items).toEqual([])
  })

  it('recientes: de la sesión más nueva a la más vieja, sin repetir', async () => {
    const [a, b, c] = [await exercise('A'), await exercise('B'), await exercise('C')]
    const s1 = await startSession(1000)
    await addExerciseToSession(s1, a)
    await addExerciseToSession(s1, b)
    await addSet({ sessionId: s1, sessionExerciseId: 'x', exerciseId: a, ...values })
    await finishSession(s1)
    const s2 = await startSession(2000)
    await addExerciseToSession(s2, c)
    await addExerciseToSession(s2, a)
    expect(await listRecentExerciseIds()).toEqual([a, c, b])
  })
})

describe('series', () => {
  it('se numeran por bloque y guardan RPE opcional', async () => {
    const sid = await startSession()
    const ex = await exercise('Press')
    const se = await addExerciseToSession(sid, ex)
    const base = { sessionId: sid, sessionExerciseId: se, exerciseId: ex }
    await addSet({ ...base, ...values }, 1000)
    await addSet({ ...base, ...values, weight: 62.5, reps: 6, rpe: 9 }, 2000)

    const sets = await listSetsForSessionExercise(se)
    expect(sets.map((s) => [s.order, s.weight, s.reps, s.rpe, s.completedAt])).toEqual([
      [0, 60, 8, undefined, 1000],
      [1, 62.5, 6, 9, 2000],
    ])
    expect(sets[0]).not.toHaveProperty('rpe')
  })

  it('editar cambia valores y puede quitar el RPE; borrar elimina', async () => {
    const sid = await startSession()
    const id = await addSet({ sessionId: sid, sessionExerciseId: 'se', exerciseId: 'e', ...values, rpe: 8 }, 1000)
    await updateSet(id, { weight: 65, reps: 5, isWarmup: true })
    const updated = await db.sets.get(id)
    expect(updated).toMatchObject({ weight: 65, reps: 5, isWarmup: true, order: 0, completedAt: 1000 })
    expect(updated).not.toHaveProperty('rpe')

    await deleteSet(id)
    expect(await db.sets.count()).toBe(0)
  })

  it('el orden sigue creciendo aunque se borren series intermedias', async () => {
    const base = { sessionId: 's', sessionExerciseId: 'se', exerciseId: 'e', ...values }
    await addSet(base)
    const second = await addSet(base)
    await addSet(base)
    await deleteSet(second)
    await addSet(base)
    expect((await listSetsForSessionExercise('se')).map((s) => s.order)).toEqual([0, 2, 3])
  })
})

describe('vista de registro', () => {
  it('incluye las series del bloque y la última vez', async () => {
    const ex = await exercise('Press')
    const s1 = await startSession(1000)
    const se1 = await addExerciseToSession(s1, ex)
    await addSet({ sessionId: s1, sessionExerciseId: se1, exerciseId: ex, ...values }, 1100)
    await addSet({ sessionId: s1, sessionExerciseId: se1, exerciseId: ex, ...values, weight: 65 }, 1200)
    await finishSession(s1, 1300)

    const s2 = await startSession(5000)
    const se2 = await addExerciseToSession(s2, ex)
    await addSet({ sessionId: s2, sessionExerciseId: se2, exerciseId: ex, ...values, weight: 70 }, 5100)

    const view = await getLogView(se2)
    expect(view?.exercise.name).toBe('Press')
    expect(view?.sets.map((s) => s.weight)).toEqual([70])
    expect(view?.lastTime?.sessionId).toBe(s1)
    expect(view?.lastTime?.sets.map((s) => s.weight)).toEqual([60, 65])
  })

  it('devuelve null si el bloque no existe', async () => {
    expect(await getLogView('nope')).toBeNull()
  })
})

describe('ajustes', () => {
  it('rellena con valores por defecto y guarda cambios', async () => {
    expect((await getSettings()).weightStep).toBe(2.5)
    await setSetting('weightStep', 5)
    const settings = await getSettings()
    expect(settings.weightStep).toBe(5)
    expect(settings.defaultRestSec).toBe(120)
  })
})

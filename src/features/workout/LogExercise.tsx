import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useLogView, useSettings } from '../../db/hooks'
import type { LogView } from '../../db/repositories/sessions'
import { removeSessionExercise } from '../../db/repositories/sessions'
import { addSet, deleteSet, updateSet } from '../../db/repositories/sets'
import { usesMachineSettings } from '../../domain/exerciseForm'
import { EXERCISE_TYPE_LABELS, MUSCLE_GROUP_LABELS } from '../../domain/labels'
import type { SettingsMap, WorkoutSet } from '../../domain/types'
import { effectiveSets, prefillValues, type SetValues } from '../../domain/workout'
import { formatDate } from '../../lib/format'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { useGoBack } from '../../ui/useGoBack'
import { MachineSettingsCard } from '../exercises/MachineSettingsCard'
import { LastTimeCard } from './LastTimeCard'
import styles from './LogExercise.module.css'
import { RestTimer } from './RestTimer'
import { startRest } from './restTimerStore'
import { SetList } from './SetList'
import { SetPanel } from './SetPanel'

/** `#/session/:id/ex/:sessionExerciseId`: registro de series de un ejercicio. */
export default function LogExercise() {
  const { id: sessionId, sessionExerciseId } = useParams<{ id: string; sessionExerciseId: string }>()
  const view = useLogView(sessionExerciseId)
  const settings = useSettings()

  if (view === undefined || settings === undefined) return null
  if (view === null) return <Navigate to={`/session/${sessionId}`} replace />
  return <LogExerciseView key={view.sessionExercise.id} view={view} settings={settings} />
}

function LogExerciseView({ view, settings }: { view: LogView; settings: SettingsMap }) {
  const { session, sessionExercise, exercise, sets } = view
  const isActive = session.status === 'active'
  const navigate = useNavigate()
  const goBack = useGoBack(`/session/${session.id}`)

  const [values, setValues] = useState<SetValues>(() => ({
    ...prefillValues(sets, view.lastTime?.sets ?? [], exercise.type),
    isWarmup: false,
  }))
  const [editing, setEditing] = useState<WorkoutSet | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  /** Lo que había en el panel antes de editar una serie, para recuperarlo después. */
  const draftBeforeEdit = useRef<SetValues | null>(null)
  const listEnd = useRef<HTMLDivElement>(null)
  const prevCount = useRef(sets.length)

  // Al añadir una serie, la lista se desplaza para que se vea.
  useEffect(() => {
    if (sets.length > prevCount.current) listEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    prevCount.current = sets.length
  }, [sets.length])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 900)
    return () => clearTimeout(t)
  }, [justSaved])

  async function saveNew() {
    await addSet({ sessionId: session.id, sessionExerciseId: sessionExercise.id, exerciseId: exercise.id, ...values })
    // El RPE y el calentamiento no se arrastran a la siguiente serie: evita registrar mal sin darse cuenta.
    setValues((v) => ({ weight: v.weight, reps: v.reps, isWarmup: false }))
    setJustSaved(true)
    if (isActive) startRest(settings.defaultRestSec)
  }

  function startEdit(set: WorkoutSet) {
    if (editing?.id === set.id) return finishEdit()
    if (!editing) draftBeforeEdit.current = values
    setEditing(set)
    setValues({ weight: set.weight, reps: set.reps, rpe: set.rpe, isWarmup: set.isWarmup })
  }

  function finishEdit() {
    setEditing(null)
    if (draftBeforeEdit.current) setValues(draftBeforeEdit.current)
    draftBeforeEdit.current = null
  }

  async function saveEdit() {
    if (!editing) return
    await updateSet(editing.id, values)
    finishEdit()
  }

  async function removeEditing() {
    if (!editing) return
    await deleteSet(editing.id)
    finishEdit()
  }

  async function removeFromSession() {
    await removeSessionExercise(sessionExercise.id)
    navigate(`/session/${session.id}`, { replace: true })
  }

  return (
    <div className={styles.screen}>
      {isActive && <RestTimer />}

      <div className={styles.scroll}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <button type="button" className={styles.back} onClick={goBack}>
              ‹ {isActive ? 'Sesión' : 'Volver'}
            </button>
            <Link to={`/exercises/${exercise.id}/edit`} className={styles.editLink}>
              Editar
            </Link>
          </div>
          <h1 className={styles.title}>{exercise.name}</h1>
          <p className={styles.subtitle}>
            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {EXERCISE_TYPE_LABELS[exercise.type]}
            {!isActive && ` · sesión del ${formatDate(session.startedAt)}`}
          </p>
        </header>

        <LastTimeCard lastTime={view.lastTime} type={exercise.type} />

        {usesMachineSettings(exercise.type) && (
          <MachineSettingsCard exerciseId={exercise.id} settings={view.machineSettings} />
        )}

        <SetList sets={sets} type={exercise.type} selectedId={editing?.id} onSelect={startEdit} />
        <div ref={listEnd} />

        {sets.length === 0 && (
          <div className={styles.remove}>
            <ConfirmButton
              label="Quitar de la sesión"
              confirmLabel="¿Quitar? Toca otra vez"
              variant="secondary"
              onConfirm={() => void removeFromSession()}
            />
          </div>
        )}
      </div>

      <SetPanel
        type={exercise.type}
        values={values}
        onChange={setValues}
        weightStep={settings.weightStep}
        editingLabel={
          editing
            ? editing.isWarmup
              ? 'el calentamiento'
              : `la serie ${effectiveSets(sets).findIndex((s) => s.id === editing.id) + 1}`
            : null
        }
        justSaved={justSaved}
        onSave={() => void saveNew()}
        onSaveEdit={() => void saveEdit()}
        onDelete={() => void removeEditing()}
        onCancelEdit={finishEdit}
      />
    </div>
  )
}

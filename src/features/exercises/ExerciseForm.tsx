import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useExercise, useExercises, useMachineSettings } from '../../db/hooks'
import { createExercise, setExerciseArchived, updateExercise } from '../../db/repositories/exercises'
import {
  cleanName,
  type ExerciseDraft,
  type ExerciseDraftErrors,
  hasErrors,
  type MachineSettingsFields as MachineFields,
  usesMachineSettings,
  validateExerciseDraft,
} from '../../domain/exerciseForm'
import { EXERCISE_TYPE_LABELS, MUSCLE_GROUP_LABELS } from '../../domain/labels'
import { EXERCISE_TYPES, type Exercise, MUSCLE_GROUPS } from '../../domain/types'
import { BigButton } from '../../ui/BigButton'
import { BottomActions } from '../../ui/BottomActions'
import { Chip, ChipRow } from '../../ui/Chip'
import { Page } from '../../ui/Page'
import { useGoBack } from '../../ui/useGoBack'
import styles from './ExerciseForm.module.css'
import { MachineSettingsFields } from './MachineSettingsFields'

const EMPTY_DRAFT: ExerciseDraft = { name: '', muscleGroup: null, type: null, notes: '' }

/** Ruta `#/exercises/new` y `#/exercises/:id/edit`. */
export default function ExerciseForm() {
  const { id } = useParams<{ id: string }>()
  const all = useExercises()
  const exercise = useExercise(id)
  const machine = useMachineSettings(id)

  if (!id) {
    return all === undefined ? null : <ExerciseFormView all={all} />
  }
  if (all === undefined || exercise === undefined || machine === undefined) return null
  if (exercise === null) {
    return (
      <Page title="No encontrado" back="/exercises">
        <p>Este ejercicio no existe.</p>
      </Page>
    )
  }
  return (
    <ExerciseFormView
      key={id}
      all={all}
      exercise={exercise}
      initialMachine={{
        seat: machine?.seat,
        backrest: machine?.backrest,
        rollers: machine?.rollers,
        grip: machine?.grip,
        notes: machine?.notes,
      }}
    />
  )
}

interface ViewProps {
  all: Exercise[]
  exercise?: Exercise
  initialMachine?: MachineFields
}

function ExerciseFormView({ all, exercise, initialMachine = {} }: ViewProps) {
  const isNew = exercise === undefined
  const goBack = useGoBack('/exercises')
  const nameRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<ExerciseDraft>(() =>
    exercise
      ? { name: exercise.name, muscleGroup: exercise.muscleGroup, type: exercise.type, notes: exercise.notes ?? '' }
      : EMPTY_DRAFT,
  )
  const [machine, setMachine] = useState<MachineFields>(initialMachine)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // El aviso "guardado" desaparece solo.
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(t)
  }, [flash])

  const errors = validateExerciseDraft(draft, all, exercise?.id)
  // Antes de intentar guardar solo se avisa del nombre repetido (es útil mientras se escribe).
  const shown: ExerciseDraftErrors = submitted ? errors : { name: draft.name.trim() ? errors.name : undefined }
  const showMachine = usesMachineSettings(draft.type)

  const patch = (p: Partial<ExerciseDraft>) => setDraft((d) => ({ ...d, ...p }))

  async function save(addAnother: boolean) {
    setSubmitted(true)
    setSaveError(null)
    if (hasErrors(errors) || draft.muscleGroup === null || draft.type === null) {
      if (errors.name) nameRef.current?.focus()
      return
    }
    const input = { name: draft.name, muscleGroup: draft.muscleGroup, type: draft.type, notes: draft.notes }
    // Si el tipo ya no usa ajustes de máquina, se conservan los guardados (por si se vuelve atrás).
    const machinePayload = showMachine ? machine : undefined

    setSaving(true)
    try {
      if (isNew) await createExercise(input, machinePayload)
      else await updateExercise(exercise.id, input, machinePayload)
    } catch (err) {
      console.error(err)
      setSaveError('No se ha podido guardar. Inténtalo de nuevo.')
      setSaving(false)
      return
    }
    setSaving(false)

    if (addAnother) {
      // Mantiene grupo y tipo: lo normal es dar de alta varios seguidos del mismo grupo.
      setFlash(`«${cleanName(draft.name)}» guardado`)
      setDraft((d) => ({ ...d, name: '', notes: '' }))
      setMachine({})
      setSubmitted(false)
      nameRef.current?.focus()
    } else {
      goBack()
    }
  }

  async function toggleArchived() {
    if (!exercise) return
    await setExerciseArchived(exercise.id, exercise.archived === 0)
    goBack()
  }

  return (
    <Page title={isNew ? 'Nuevo ejercicio' : 'Editar ejercicio'} back="/exercises">
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void save(false)
        }}
      >
        {exercise?.archived === 1 && <p className={styles.banner}>Este ejercicio está archivado.</p>}

        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            ref={nameRef}
            className={styles.input}
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            onKeyDown={(e) => {
              // Intro cierra el teclado en vez de enviar: aún faltan grupo y tipo.
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            placeholder="Press de banca"
            autoFocus={isNew}
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="done"
            aria-invalid={shown.name ? true : undefined}
          />
          {shown.name && <span className={styles.error}>{shown.name}</span>}
        </label>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Grupo muscular</legend>
          <ChipRow>
            {MUSCLE_GROUPS.map((g) => (
              <Chip key={g} selected={draft.muscleGroup === g} onClick={() => patch({ muscleGroup: g })}>
                {MUSCLE_GROUP_LABELS[g]}
              </Chip>
            ))}
          </ChipRow>
          {shown.muscleGroup && <span className={styles.error}>{shown.muscleGroup}</span>}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Tipo</legend>
          <ChipRow>
            {EXERCISE_TYPES.map((t) => (
              <Chip key={t} selected={draft.type === t} onClick={() => patch({ type: t })}>
                {EXERCISE_TYPE_LABELS[t]}
              </Chip>
            ))}
          </ChipRow>
          {shown.type && <span className={styles.error}>{shown.type}</span>}
        </fieldset>

        {showMachine && <MachineSettingsFields value={machine} onChange={setMachine} />}

        <label className={styles.field}>
          <span className={styles.label}>Notas del ejercicio (opcional)</span>
          <textarea
            className={styles.textarea}
            rows={2}
            value={draft.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </label>

        {!isNew && (
          <BigButton variant={exercise.archived ? 'secondary' : 'danger'} onClick={() => void toggleArchived()}>
            {exercise.archived ? 'Restaurar ejercicio' : 'Archivar ejercicio'}
          </BigButton>
        )}

        <div className={styles.status} aria-live="polite">
          {saveError && <span className={styles.error}>{saveError}</span>}
          {flash && <span className={styles.flash}>✓ {flash}</span>}
        </div>

        <BottomActions>
          {isNew && (
            <BigButton variant="secondary" disabled={saving} onClick={() => void save(true)}>
              Guardar y otro
            </BigButton>
          )}
          <BigButton type="submit" disabled={saving}>
            Guardar
          </BigButton>
        </BottomActions>
      </form>
    </Page>
  )
}

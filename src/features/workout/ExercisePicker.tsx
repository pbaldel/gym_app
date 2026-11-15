import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useExercises, useRecentExerciseIds } from '../../db/hooks'
import { createExercise } from '../../db/repositories/exercises'
import { addExerciseToSession } from '../../db/repositories/sessions'
import { cleanName, validateExerciseDraft } from '../../domain/exerciseForm'
import { EXERCISE_TYPE_LABELS, MUSCLE_GROUP_LABELS } from '../../domain/labels'
import { EMPTY_FILTER, filterExercises, normalizeText } from '../../domain/search'
import { EXERCISE_TYPES, type Exercise, type ExerciseType, type Id, MUSCLE_GROUPS, type MuscleGroup } from '../../domain/types'
import { BigButton } from '../../ui/BigButton'
import { Chip, ChipRow } from '../../ui/Chip'
import { List, ListButton, SectionTitle } from '../../ui/List'
import { Page } from '../../ui/Page'
import styles from './ExercisePicker.module.css'

const RECENT_LIMIT = 8

/** `#/session/:id/pick`: elegir (o crear) el ejercicio que se añade a la sesión. */
export default function ExercisePicker() {
  const { id: sessionId } = useParams<{ id: string }>()
  const exercises = useExercises()
  const recentIds = useRecentExerciseIds()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  if (!sessionId || exercises === undefined || recentIds === undefined) return null

  async function pick(exerciseId: Id) {
    if (!sessionId || busy) return
    setBusy(true)
    try {
      const seId = await addExerciseToSession(sessionId, exerciseId)
      navigate(`/session/${sessionId}/ex/${seId}`, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const active = filterExercises(exercises, { ...EMPTY_FILTER, query })
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const recent = query
    ? []
    : recentIds
        .map((id) => byId.get(id))
        .filter((e): e is Exercise => e !== undefined && e.archived === 0)
        .slice(0, RECENT_LIMIT)
  const exactMatch = exercises.some((e) => normalizeText(e.name) === normalizeText(query))
  const canCreate = cleanName(query) !== '' && !exactMatch

  const row = (e: Exercise) => (
    <ListButton
      key={e.id}
      onClick={() => void pick(e.id)}
      disabled={busy}
      title={e.name}
      meta={`${MUSCLE_GROUP_LABELS[e.muscleGroup]} · ${EXERCISE_TYPE_LABELS[e.type]}`}
    />
  )

  return (
    <Page title="Añadir ejercicio" back={`/session/${sessionId}`}>
      <input
        type="search"
        className={styles.search}
        placeholder="Buscar o crear"
        aria-label="Buscar ejercicio"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />

      {canCreate && (
        <QuickCreate
          name={query}
          existing={exercises}
          disabled={busy}
          onCreated={(id) => void pick(id)}
        />
      )}

      {recent.length > 0 && (
        <>
          <SectionTitle>Recientes</SectionTitle>
          <List>{recent.map(row)}</List>
        </>
      )}

      {active.length > 0 ? (
        <>
          <SectionTitle>{query ? 'Resultados' : 'Todos'}</SectionTitle>
          <List>{active.map(row)}</List>
        </>
      ) : (
        !canCreate && (
          <p className={styles.empty}>
            {exactMatch
              ? 'Ese ejercicio está archivado. Restáuralo desde la pestaña Ejercicios.'
              : 'Escribe un nombre para crear tu primer ejercicio.'}
          </p>
        )
      )}
    </Page>
  )
}

interface QuickCreateProps {
  name: string
  existing: Exercise[]
  disabled: boolean
  onCreated: (id: Id) => void
}

/** "fondos en paralelas" → "Fondos en paralelas" (el buscador no pone mayúscula inicial). */
function capitalize(text: string) {
  const clean = cleanName(text)
  return clean.charAt(0).toLocaleUpperCase('es-ES') + clean.slice(1)
}

/** Alta rápida en línea: nombre (el de la búsqueda), grupo y tipo. */
function QuickCreate({ name: rawName, existing, disabled, onCreated }: QuickCreateProps) {
  const name = capitalize(rawName)
  const [open, setOpen] = useState(false)
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null)
  const [type, setType] = useState<ExerciseType | null>(null)
  const [saving, setSaving] = useState(false)

  const errors = validateExerciseDraft({ name, muscleGroup, type, notes: '' }, existing)

  if (!open) {
    return (
      <button type="button" className={styles.createRow} onClick={() => setOpen(true)}>
        + Crear «{name}»
      </button>
    )
  }

  async function create() {
    if (muscleGroup === null || type === null || errors.name) return
    setSaving(true)
    try {
      onCreated(await createExercise({ name, muscleGroup, type }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.create}>
      <h2 className={styles.createTitle}>Nuevo: «{name}»</h2>
      {errors.name && <p className={styles.error}>{errors.name}</p>}
      <span className={styles.label}>Grupo muscular</span>
      <ChipRow>
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g} selected={muscleGroup === g} onClick={() => setMuscleGroup(g)}>
            {MUSCLE_GROUP_LABELS[g]}
          </Chip>
        ))}
      </ChipRow>
      <span className={styles.label}>Tipo</span>
      <ChipRow>
        {EXERCISE_TYPES.map((t) => (
          <Chip key={t} selected={type === t} onClick={() => setType(t)}>
            {EXERCISE_TYPE_LABELS[t]}
          </Chip>
        ))}
      </ChipRow>
      <BigButton
        onClick={() => void create()}
        disabled={disabled || saving || muscleGroup === null || type === null || Boolean(errors.name)}
      >
        Crear y añadir
      </BigButton>
    </section>
  )
}

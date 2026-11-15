import { Link, useSearchParams } from 'react-router'
import { useExercises } from '../../db/hooks'
import { EXERCISE_TYPE_LABELS, MUSCLE_GROUP_LABELS } from '../../domain/labels'
import { type ExerciseFilter, filterExercises } from '../../domain/search'
import { EXERCISE_TYPES, type ExerciseType, MUSCLE_GROUPS, type MuscleGroup } from '../../domain/types'
import { Chip, ChipRow } from '../../ui/Chip'
import { List, ListLink } from '../../ui/List'
import { Page } from '../../ui/Page'
import styles from './ExerciseList.module.css'

// Los filtros viven en la URL (?q=&g=&t=&a=1) para conservarlos al volver
// de editar un ejercicio.
function readFilter(params: URLSearchParams): ExerciseFilter {
  const g = params.get('g')
  const t = params.get('t')
  return {
    query: params.get('q') ?? '',
    muscleGroup: MUSCLE_GROUPS.includes(g as MuscleGroup) ? (g as MuscleGroup) : null,
    type: EXERCISE_TYPES.includes(t as ExerciseType) ? (t as ExerciseType) : null,
    archived: params.get('a') === '1',
  }
}

function writeFilter(filter: ExerciseFilter): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.query) params.set('q', filter.query)
  if (filter.muscleGroup) params.set('g', filter.muscleGroup)
  if (filter.type) params.set('t', filter.type)
  if (filter.archived) params.set('a', '1')
  return params
}

export default function ExerciseList() {
  const exercises = useExercises()
  const [params, setParams] = useSearchParams()
  const filter = readFilter(params)
  const update = (patch: Partial<ExerciseFilter>) =>
    setParams(writeFilter({ ...filter, ...patch }), { replace: true })

  const visible = exercises ? filterExercises(exercises, filter) : []
  const activeCount = exercises?.filter((e) => e.archived === 0).length ?? 0
  const isFiltered = filter.query !== '' || filter.muscleGroup !== null || filter.type !== null

  return (
    <Page title="Ejercicios">
      <input
        type="search"
        className={styles.search}
        placeholder={`Buscar en ${activeCount} ejercicios`}
        aria-label="Buscar ejercicio"
        value={filter.query}
        onChange={(e) => update({ query: e.target.value })}
        autoComplete="off"
        enterKeyHint="search"
      />

      <div className={styles.filters}>
        <ChipRow scroll>
          {MUSCLE_GROUPS.map((g) => (
            <Chip
              key={g}
              selected={filter.muscleGroup === g}
              onClick={() => update({ muscleGroup: filter.muscleGroup === g ? null : g })}
            >
              {MUSCLE_GROUP_LABELS[g]}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow scroll>
          {EXERCISE_TYPES.map((t) => (
            <Chip key={t} selected={filter.type === t} onClick={() => update({ type: filter.type === t ? null : t })}>
              {EXERCISE_TYPE_LABELS[t]}
            </Chip>
          ))}
          <Chip selected={filter.archived} onClick={() => update({ archived: !filter.archived })}>
            Archivados
          </Chip>
        </ChipRow>
      </div>

      {exercises === undefined ? null : visible.length > 0 ? (
        <List className={styles.list}>
          {visible.map((e) => (
            <ListLink
              key={e.id}
              to={`/exercises/${e.id}/edit`}
              title={e.name}
              meta={`${MUSCLE_GROUP_LABELS[e.muscleGroup]} · ${EXERCISE_TYPE_LABELS[e.type]}`}
            />
          ))}
        </List>
      ) : (
        <div className={styles.empty}>
          {filter.archived ? (
            <p>No hay ejercicios archivados{isFiltered ? ' con estos filtros' : ''}.</p>
          ) : activeCount === 0 ? (
            <p>Aún no hay ejercicios. Pulsa + para añadir el primero.</p>
          ) : (
            <>
              <p>Ningún ejercicio coincide.</p>
              <button type="button" className={styles.clear} onClick={() => setParams({}, { replace: true })}>
                Quitar filtros
              </button>
            </>
          )}
        </div>
      )}

      <Link to="/exercises/new" className={styles.fab} aria-label="Nuevo ejercicio">
        +
      </Link>
    </Page>
  )
}

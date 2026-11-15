import type { ExerciseType, Id, WorkoutSet } from '../../domain/types'
import { formatWeight } from '../../lib/format'
import styles from './LogExercise.module.css'

interface Props {
  sets: WorkoutSet[]
  type: ExerciseType
  selectedId: Id | undefined
  onSelect: (set: WorkoutSet) => void
}

function weightText(weight: number, type: ExerciseType) {
  if (type === 'peso_corporal') return weight > 0 ? `+${formatWeight(weight)} kg` : 'Corporal'
  return `${formatWeight(weight)} kg`
}

/** Series de hoy. Tocar una la carga en el panel para editarla o borrarla. */
export function SetList({ sets, type, selectedId, onSelect }: Props) {
  if (sets.length === 0) return null
  // Los calentamientos se marcan con "C" y no consumen número.
  const labels = sets.map((s, i) =>
    s.isWarmup ? 'C' : String(sets.slice(0, i + 1).filter((x) => !x.isWarmup).length),
  )
  return (
    <ol className={styles.sets} aria-label="Series de hoy">
      {sets.map((s, i) => {
        const label = labels[i]
        const selected = s.id === selectedId
        return (
          <li key={s.id}>
            <button
              type="button"
              className={selected ? `${styles.setRow} ${styles.selected}` : styles.setRow}
              aria-pressed={selected}
              onClick={() => onSelect(s)}
            >
              <span className={s.isWarmup ? `${styles.setNumber} ${styles.warmup}` : styles.setNumber}>{label}</span>
              <span className={styles.setMain}>
                {weightText(s.weight, type)} <span className={styles.times}>×</span> {s.reps}
              </span>
              <span className={styles.setRpe}>
                {s.isWarmup ? 'Calent.' : s.rpe !== undefined ? `RPE ${formatWeight(s.rpe)}` : ''}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

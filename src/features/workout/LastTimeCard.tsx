import type { ExerciseType } from '../../domain/types'
import type { LastTime } from '../../domain/workout'
import { formatRelativeDay, formatSet } from '../../lib/format'
import styles from './LogExercise.module.css'

/** Tarjeta plegable "Última vez" con las series en chips. */
export function LastTimeCard({ lastTime, type }: { lastTime: LastTime | null; type: ExerciseType }) {
  if (!lastTime) {
    return <p className={styles.firstTime}>Primera vez con este ejercicio.</p>
  }
  return (
    <details className={styles.card} open>
      <summary className={styles.cardSummary}>
        Última vez <span className={styles.cardHint}>· {formatRelativeDay(lastTime.date)}</span>
      </summary>
      <div className={styles.lastSets}>
        {lastTime.sets.map((s) => (
          <span key={s.id} className={s.isWarmup ? `${styles.setChip} ${styles.warmup}` : styles.setChip}>
            {formatSet(s, type)}
          </span>
        ))}
      </div>
    </details>
  )
}

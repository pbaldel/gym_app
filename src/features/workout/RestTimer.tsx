import { useEffect } from 'react'
import { remainingMs } from '../../domain/workout'
import { formatCountdown } from '../../lib/format'
import { useNow } from '../../ui/useNow'
import styles from './RestTimer.module.css'
import { adjustRest, stopRest, useRestTimer } from './restTimerStore'

/** Tras terminar, el aviso se queda un minuto y luego desaparece solo. */
const LINGER_MS = 60_000

/** Barra superior con la cuenta atrás del descanso, ±15 s y "Saltar". */
export function RestTimer() {
  const timer = useRestTimer()
  const tick = useNow(250, timer !== null)
  // `tick` puede ser anterior al inicio si el temporizador acaba de arrancar.
  const now = timer ? Math.max(tick, timer.endsAt - timer.durationMs) : tick

  useEffect(() => {
    if (timer && now - timer.endsAt > LINGER_MS) stopRest()
  }, [timer, now])

  if (!timer) return null
  const left = remainingMs(timer.endsAt, now)
  const done = left === 0
  const progress = timer.durationMs > 0 ? left / timer.durationMs : 0

  return (
    <div className={done ? `${styles.bar} ${styles.done}` : styles.bar} role="timer" aria-live="off">
      <div className={styles.progress} style={{ transform: `scaleX(${progress})` }} />
      <button type="button" className={styles.adjust} onClick={() => adjustRest(-15)} aria-label="Restar 15 segundos">
        −15
      </button>
      <div className={styles.time}>
        {done ? '¡A por la siguiente!' : <>Descanso <strong>{formatCountdown(left)}</strong></>}
      </div>
      <button type="button" className={styles.adjust} onClick={() => adjustRest(15)} aria-label="Sumar 15 segundos">
        +15
      </button>
      <button type="button" className={styles.skip} onClick={stopRest}>
        {done ? 'Cerrar' : 'Saltar'}
      </button>
    </div>
  )
}

import { useEffect, useState } from 'react'

/**
 * Hora actual que se refresca cada `intervalMs` y al volver de segundo plano.
 * Con `enabled = false` no programa nada (el valor se queda congelado).
 */
export function useNow(intervalMs: number, enabled = true): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs, enabled])

  return now
}

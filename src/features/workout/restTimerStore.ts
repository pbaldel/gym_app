import { useSyncExternalStore } from 'react'

// Estado del temporizador de descanso. Se calcula con timestamps (endsAt), no con
// un setInterval acumulado, para que siga siendo correcto si la app pasa a segundo
// plano. Se guarda en localStorage para sobrevivir a una recarga.

export interface RestTimerState {
  endsAt: number
  durationMs: number
}

const KEY = 'gymlog.restTimer'
const listeners = new Set<() => void>()
let state: RestTimerState | null = load()

function load(): RestTimerState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RestTimerState>
    if (typeof parsed.endsAt === 'number' && typeof parsed.durationMs === 'number') {
      return { endsAt: parsed.endsAt, durationMs: parsed.durationMs }
    }
  } catch {
    // localStorage no disponible o dato corrupto: sin temporizador.
  }
  return null
}

function set(next: RestTimerState | null) {
  state = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // Sin persistencia: el temporizador sigue funcionando en memoria.
  }
  for (const l of listeners) l()
}

export function startRest(seconds: number, now: number = Date.now()) {
  if (seconds <= 0) return set(null)
  set({ endsAt: now + seconds * 1000, durationMs: seconds * 1000 })
}

/** ±15 s. Si ya había terminado, cuenta desde ahora. */
export function adjustRest(deltaSeconds: number, now: number = Date.now()) {
  if (!state) return
  const base = Math.max(state.endsAt, now)
  const endsAt = base + deltaSeconds * 1000
  if (endsAt <= now) return set(null)
  set({ endsAt, durationMs: Math.max(state.durationMs + deltaSeconds * 1000, endsAt - now) })
}

export function stopRest() {
  set(null)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRestTimer(): RestTimerState | null {
  return useSyncExternalStore(subscribe, () => state)
}

import type { ExerciseType, WorkoutSet } from '../domain/types'
import { effectiveSets } from '../domain/workout'

const weightFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: false })

/** 62.5 → "62,5"; 60 → "60". */
export function formatWeight(kg: number): string {
  return weightFormat.format(kg)
}

/** Acepta coma o punto: "62,5" → 62.5. Devuelve null si no es un número válido. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '' || !/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

/** "60×8", "60×8 (RPE 9)", "+10×8" (lastre), "×12" (solo peso corporal). */
export function formatSet(set: Pick<WorkoutSet, 'weight' | 'reps' | 'rpe'>, type?: ExerciseType): string {
  let weight = formatWeight(set.weight)
  if (type === 'peso_corporal') weight = set.weight > 0 ? `+${weight}` : ''
  const rpe = set.rpe !== undefined ? ` (RPE ${formatWeight(set.rpe)})` : ''
  return `${weight}×${set.reps}${rpe}`
}

function weightLabel(kg: number, type: ExerciseType): string {
  return type === 'peso_corporal' ? `+${formatWeight(kg)} kg` : `${formatWeight(kg)} kg`
}

/**
 * Resumen de un ejercicio en la sesión: "3 × 8 @ 60 kg", "3 × 12" (peso corporal),
 * "4 series · 60–70 kg" si varían.
 */
export function summarizeSets(sets: readonly WorkoutSet[], type: ExerciseType): string {
  if (sets.length === 0) return 'Sin series'
  const eff = effectiveSets(sets)
  if (eff.length === 0) return `${sets.length} de calentamiento`

  const weights = eff.map((s) => s.weight)
  const reps = eff.map((s) => s.reps)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const sameReps = reps.every((r) => r === reps[0])
  const noWeight = type === 'peso_corporal' && maxW === 0

  if (minW === maxW && sameReps) {
    return noWeight ? `${eff.length} × ${reps[0]}` : `${eff.length} × ${reps[0]} @ ${weightLabel(maxW, type)}`
  }
  const series = eff.length === 1 ? '1 serie' : `${eff.length} series`
  if (noWeight) return `${series} · ${Math.min(...reps)}–${Math.max(...reps)} reps`
  if (minW === maxW) return `${series} · ${weightLabel(maxW, type)}`
  return `${series} · ${formatWeight(minW)}–${weightLabel(maxW, type)}`
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Días naturales entre dos instantes (según la hora local). */
export function calendarDaysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000)
}

/** "hoy", "ayer", "hace 4 días", "hace 2 semanas", "12 mar" o "12 mar 2025". */
export function formatRelativeDay(ts: number, now: number = Date.now()): string {
  const days = calendarDaysBetween(ts, now)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  }
  return formatDate(ts, now)
}

/** "12 mar" (mismo año) o "12 mar 2025". */
export function formatDate(ts: number, now: number = Date.now()): string {
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear()
  return new Date(ts)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
    .replace('.', '')
}

/** "lun 12 mar". */
export function formatWeekdayDate(ts: number, now: number = Date.now()): string {
  const weekday = new Date(ts).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  return `${weekday} ${formatDate(ts, now)}`
}

/** "18:05". */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

/** "45 min", "1 h 05 min". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h === 0 ? `${m} min` : `${h} h ${String(m).padStart(2, '0')} min`
}

/** Cuenta atrás "1:30". Redondea hacia arriba para no mostrar 0:00 antes de tiempo. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

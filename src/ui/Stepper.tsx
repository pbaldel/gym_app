import { useRef, useState } from 'react'
import styles from './Stepper.module.css'

interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  step: number
  /** Paso alternativo con pulsación larga en − / +. */
  fineStep?: number
  min?: number
  /** Texto mostrado para el valor. */
  format: (value: number) => string
  /** Convierte lo tecleado en número; null = no válido (se descarta). */
  parse: (text: string) => number | null
  unit?: string
  inputMode: 'decimal' | 'numeric'
}

const LONG_PRESS_MS = 450

/** Botón − / + que distingue toque corto y pulsación larga. */
function useLongPress(onShort: () => void, onLong?: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const fired = useRef(false)
  const clear = () => window.clearTimeout(timer.current)
  return {
    onPointerDown: () => {
      fired.current = false
      if (!onLong) return
      clear()
      timer.current = window.setTimeout(() => {
        fired.current = true
        onLong()
      }, LONG_PRESS_MS)
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClick: () => {
      if (fired.current) {
        fired.current = false
        return
      }
      onShort()
    },
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }
}

/** `[−] 62,5 kg [+]`. Tocar el número abre el teclado. */
export function Stepper({ label, value, onChange, step, fineStep, min = 0, format, parse, unit, inputMode }: StepperProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')

  const add = (delta: number) => onChange(Math.max(min, Math.round((value + delta) * 100) / 100))
  const minus = useLongPress(
    () => add(-step),
    fineStep ? () => add(-fineStep) : undefined,
  )
  const plus = useLongPress(
    () => add(step),
    fineStep ? () => add(fineStep) : undefined,
  )

  function startEditing() {
    setText(format(value))
    setEditing(true)
  }

  function commit() {
    const parsed = parse(text)
    if (parsed !== null && parsed >= min) onChange(parsed)
    setEditing(false)
  }

  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.btn} aria-label={`Restar ${label.toLowerCase()}`} {...minus}>
        −
      </button>
      <div className={styles.center}>
        <span className={styles.label}>{label}</span>
        {editing ? (
          <input
            className={styles.input}
            value={text}
            inputMode={inputMode}
            enterKeyHint="done"
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditing(false)
            }}
            aria-label={label}
          />
        ) : (
          <button type="button" className={styles.value} onClick={startEditing} aria-label={`${label}: ${format(value)}${unit ? ` ${unit}` : ''}. Tocar para escribir`}>
            {format(value)}
            {unit && <small className={styles.unit}>{unit}</small>}
          </button>
        )}
      </div>
      <button type="button" className={styles.btn} aria-label={`Sumar ${label.toLowerCase()}`} {...plus}>
        +
      </button>
    </div>
  )
}

import type { ReactNode } from 'react'
import styles from './Chip.module.css'

interface ChipProps {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
}

/** Botón de selección compacto (filtros, opciones). */
export function Chip({ selected = false, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={selected ? `${styles.chip} ${styles.selected}` : styles.chip}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** Fila de chips: con `scroll` se desliza en horizontal en vez de saltar de línea. */
export function ChipRow({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  return <div className={scroll ? `${styles.row} ${styles.scroll}` : styles.row}>{children}</div>
}

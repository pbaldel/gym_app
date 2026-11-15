import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './List.module.css'

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={className ? `${styles.list} ${className}` : styles.list}>{children}</ul>
}

interface RowContentProps {
  title: ReactNode
  meta?: ReactNode
  /** Elemento a la izquierda (p. ej. el número de orden). */
  leading?: ReactNode
  /** Elemento a la derecha (p. ej. una flecha o un resumen). */
  trailing?: ReactNode
}

function RowContent({ title, meta, leading, trailing }: RowContentProps) {
  return (
    <>
      {leading !== undefined && <span className={styles.leading}>{leading}</span>}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {meta !== undefined && <span className={styles.meta}>{meta}</span>}
      </span>
      {trailing !== undefined && <span className={styles.trailing}>{trailing}</span>}
    </>
  )
}

export function ListLink({ to, ...content }: RowContentProps & { to: string }) {
  return (
    <li>
      <Link to={to} className={styles.item}>
        <RowContent {...content} />
      </Link>
    </li>
  )
}

export function ListButton({
  onClick,
  disabled,
  ...content
}: RowContentProps & { onClick: () => void; disabled?: boolean }) {
  return (
    <li>
      <button type="button" className={styles.item} onClick={onClick} disabled={disabled}>
        <RowContent {...content} />
      </button>
    </li>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.section}>{children}</h2>
}

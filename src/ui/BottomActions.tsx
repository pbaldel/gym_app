import type { ReactNode } from 'react'
import styles from './BottomActions.module.css'

/** Zona de acciones pegada abajo (al alcance del pulgar), respetando la barra de inicio. */
export function BottomActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}

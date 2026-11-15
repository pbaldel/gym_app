import type { ReactNode } from 'react'
import { BottomActions } from './BottomActions'
import styles from './Page.module.css'
import { useGoBack } from './useGoBack'

interface PageProps {
  title: string
  /** Si se indica, muestra "‹ Volver" (atrás en el historial o, si no hay, a esta ruta). */
  back?: string
  /** Botones de acción pegados abajo, al alcance del pulgar, aunque haya poco contenido. */
  actions?: ReactNode
  children?: ReactNode
}

/** Contenedor básico de pantalla: título y contenido con márgenes. */
export function Page({ title, back, actions, children }: PageProps) {
  const goBack = useGoBack(back ?? '/')
  return (
    <main className={actions ? `${styles.page} ${styles.withActions}` : styles.page}>
      {back !== undefined && (
        <button type="button" className={styles.back} onClick={goBack}>
          ‹ Volver
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      {actions ? (
        <>
          <div className={styles.body}>{children}</div>
          <BottomActions>{actions}</BottomActions>
        </>
      ) : (
        children
      )}
    </main>
  )
}

import type { ReactNode } from 'react'
import styles from './Page.module.css'
import { useGoBack } from './useGoBack'

interface PageProps {
  title: string
  /** Si se indica, muestra "‹ Volver" (atrás en el historial o, si no hay, a esta ruta). */
  back?: string
  children?: ReactNode
}

/** Contenedor básico de pantalla: título y contenido con márgenes. */
export function Page({ title, back, children }: PageProps) {
  const goBack = useGoBack(back ?? '/')
  return (
    <main className={styles.page}>
      {back !== undefined && (
        <button type="button" className={styles.back} onClick={goBack}>
          ‹ Volver
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      {children}
    </main>
  )
}

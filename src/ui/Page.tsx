import type { ReactNode } from 'react'
import styles from './Page.module.css'

interface PageProps {
  title: string
  children?: ReactNode
}

/** Contenedor básico de pantalla: título y contenido con márgenes. */
export function Page({ title, children }: PageProps) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {children}
    </main>
  )
}

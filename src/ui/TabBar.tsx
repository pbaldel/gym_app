import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import styles from './TabBar.module.css'

interface Tab {
  to: string
  label: string
  icon: ReactNode
}

// Iconos inline (trazo 2 px) para no añadir dependencias.
const svg = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
)

const TABS: Tab[] = [
  { to: '/', label: 'Entrenar', icon: svg('M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12') },
  { to: '/exercises', label: 'Ejercicios', icon: svg('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01') },
  { to: '/progress', label: 'Progreso', icon: svg('M3 20h18M5 16l5-5 4 4 6-7') },
  {
    to: '/settings',
    label: 'Ajustes',
    icon: svg('M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4'),
  },
]

export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="Navegación principal">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

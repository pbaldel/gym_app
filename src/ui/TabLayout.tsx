import { Outlet } from 'react-router'
import { TabBar } from './TabBar'
import styles from './TabLayout.module.css'

/** Layout de las pantallas principales: contenido + barra de pestañas inferior. */
export function TabLayout() {
  return (
    <>
      <div className={styles.content}>
        <Outlet />
      </div>
      <TabBar />
    </>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useActiveSession, useDoneSessionViews, useSessionView } from '../../db/hooks'
import { startSession } from '../../db/repositories/sessions'
import { effectiveSets } from '../../domain/workout'
import { formatDuration, formatTime } from '../../lib/format'
import { BigButton } from '../../ui/BigButton'
import { List, SectionTitle } from '../../ui/List'
import { Page } from '../../ui/Page'
import { useNow } from '../../ui/useNow'
import { SessionRow } from '../history/SessionRow'
import styles from './Home.module.css'

export default function Home() {
  const active = useActiveSession()
  const recent = useDoneSessionViews(5)
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)

  async function start() {
    setStarting(true)
    try {
      const id = await startSession()
      navigate(`/session/${id}`)
    } finally {
      setStarting(false)
    }
  }

  return (
    <Page title="Entrenar">
      {active === undefined ? null : active ? (
        <ActiveSessionCard sessionId={active.id} />
      ) : (
        <BigButton size="lg" onClick={() => void start()} disabled={starting}>
          Empezar sesión
        </BigButton>
      )}

      {recent && recent.length > 0 && (
        <>
          <SectionTitle>Últimas sesiones</SectionTitle>
          <List>
            {recent.map((v) => (
              <SessionRow key={v.session.id} view={v} />
            ))}
          </List>
          <Link to="/history" className={styles.more}>
            Ver todo el historial
          </Link>
        </>
      )}
      {recent && recent.length === 0 && !active && (
        <p className={styles.hint}>Cuando termines tu primera sesión aparecerá aquí.</p>
      )}
    </Page>
  )
}

function ActiveSessionCard({ sessionId }: { sessionId: string }) {
  const view = useSessionView(sessionId)
  const now = useNow(30_000)
  if (!view) return null
  const { session, items } = view
  const sets = items.reduce((n, i) => n + effectiveSets(i.sets).length, 0)

  return (
    <section className={styles.card}>
      <span className={styles.badge}>Sesión en curso</span>
      <p className={styles.cardMeta}>
        Desde las {formatTime(session.startedAt)} · {formatDuration(now - session.startedAt)}
        <br />
        {items.length} {items.length === 1 ? 'ejercicio' : 'ejercicios'} · {sets} {sets === 1 ? 'serie' : 'series'}
      </p>
      <Link to={`/session/${session.id}`} className={styles.resume}>
        Reanudar
      </Link>
    </section>
  )
}

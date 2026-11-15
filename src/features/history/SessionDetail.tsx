import { Navigate, useNavigate, useParams } from 'react-router'
import { useSessionView } from '../../db/hooks'
import { deleteSession } from '../../db/repositories/sessions'
import { formatDuration, formatSet, formatTime, formatWeekdayDate, summarizeSets } from '../../lib/format'
import { BigButton } from '../../ui/BigButton'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { List, ListLink } from '../../ui/List'
import { Page } from '../../ui/Page'
import styles from './SessionDetail.module.css'

/** `#/history/:sessionId`: detalle editable de una sesión terminada. */
export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const view = useSessionView(sessionId)
  const navigate = useNavigate()

  if (view === undefined) return null
  if (view === null) return <Navigate to="/history" replace />
  if (view.session.status === 'active') return <Navigate to={`/session/${view.session.id}`} replace />

  const { session, items } = view

  async function remove() {
    await deleteSession(session.id)
    navigate('/history', { replace: true })
  }

  return (
    <Page
      title={formatWeekdayDate(session.startedAt)}
      back="/history"
      actions={
        <>
          <ConfirmButton label="Borrar sesión" confirmLabel="¿Borrar? No se puede deshacer" onConfirm={() => void remove()} />
          <BigButton variant="secondary" onClick={() => navigate(`/session/${session.id}/pick`)}>
            Añadir ejercicio
          </BigButton>
        </>
      }
    >
      <p>
        {formatTime(session.startedAt)}
        {session.endedAt && ` – ${formatTime(session.endedAt)} · ${formatDuration(session.endedAt - session.startedAt)}`}
      </p>
      <p className={styles.hint}>Toca un ejercicio para corregir sus series.</p>
      <List>
        {items.map(({ sessionExercise: se, exercise, sets }, i) => (
          <ListLink
            key={se.id}
            to={`/session/${session.id}/ex/${se.id}`}
            leading={i + 1}
            title={exercise?.name ?? 'Ejercicio desconocido'}
            meta={
              exercise && (
                <>
                  {summarizeSets(sets, exercise.type)}
                  <br />
                  {sets.map((s) => formatSet(s, exercise.type) + (s.isWarmup ? ' (cal.)' : '')).join(' · ')}
                </>
              )
            }
            trailing="›"
          />
        ))}
      </List>
    </Page>
  )
}

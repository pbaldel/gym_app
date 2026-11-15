import { Navigate, useNavigate, useParams } from 'react-router'
import { useSessionView } from '../../db/hooks'
import { finishSession } from '../../db/repositories/sessions'
import { formatDuration, formatTime, summarizeSets } from '../../lib/format'
import { BigButton } from '../../ui/BigButton'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { List, ListLink } from '../../ui/List'
import { Page } from '../../ui/Page'
import { useNow } from '../../ui/useNow'
import { RestTimer } from './RestTimer'
import { stopRest } from './restTimerStore'

/** `#/session/:id`: sesión en curso. */
export default function ActiveSession() {
  const { id } = useParams<{ id: string }>()
  const view = useSessionView(id)
  const navigate = useNavigate()
  const now = useNow(30_000)

  if (view === undefined) return null
  if (view === null) return <Navigate to="/" replace />
  if (view.session.status === 'done') return <Navigate to={`/history/${view.session.id}`} replace />

  const { session, items } = view

  async function finish() {
    await finishSession(session.id)
    stopRest()
    navigate('/', { replace: true })
  }

  return (
    <>
      <RestTimer />
      <Page
        title="Sesión"
        back="/"
        actions={
          <>
            <ConfirmButton
              label="Terminar"
              confirmLabel="¿Terminar?"
              variant="secondary"
              onConfirm={() => void finish()}
            />
            <BigButton onClick={() => navigate(`/session/${session.id}/pick`)}>Añadir ejercicio</BigButton>
          </>
        }
      >
        <p>
          Desde las {formatTime(session.startedAt)} · {formatDuration(now - session.startedAt)}
        </p>
        {items.length === 0 ? (
          <p>Añade el primer ejercicio para empezar.</p>
        ) : (
          <List>
            {items.map(({ sessionExercise: se, exercise, sets }, i) => (
              <ListLink
                key={se.id}
                to={`/session/${session.id}/ex/${se.id}`}
                leading={i + 1}
                title={exercise?.name ?? 'Ejercicio desconocido'}
                meta={exercise ? summarizeSets(sets, exercise.type) : undefined}
                trailing="›"
              />
            ))}
          </List>
        )}
      </Page>
    </>
  )
}

import type { SessionView } from '../../db/repositories/sessions'
import { effectiveSets } from '../../domain/workout'
import { formatDuration, formatRelativeDay, formatWeekdayDate } from '../../lib/format'
import { ListLink } from '../../ui/List'

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

/** Fila de una sesión terminada: fecha, ejercicios, series y duración. */
export function SessionRow({ view }: { view: SessionView }) {
  const { session, items } = view
  const sets = items.reduce((n, i) => n + effectiveSets(i.sets).length, 0)
  const names = items.map((i) => i.exercise?.name ?? '¿?')
  const shown = names.slice(0, 3).join(', ') + (names.length > 3 ? ` y ${names.length - 3} más` : '')
  const duration = session.endedAt ? ` · ${formatDuration(session.endedAt - session.startedAt)}` : ''

  return (
    <ListLink
      to={`/history/${session.id}`}
      title={`${formatWeekdayDate(session.startedAt)} · ${formatRelativeDay(session.startedAt)}`}
      meta={
        <>
          {plural(items.length, 'ejercicio', 'ejercicios')} · {plural(sets, 'serie', 'series')}
          {duration}
          <br />
          {shown}
        </>
      }
      trailing="›"
    />
  )
}

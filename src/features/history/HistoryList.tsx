import { useDoneSessionViews } from '../../db/hooks'
import { List } from '../../ui/List'
import { Page } from '../../ui/Page'
import { SessionRow } from './SessionRow'

/** `#/history`: todas las sesiones terminadas. */
export default function HistoryList() {
  const views = useDoneSessionViews()
  return (
    <Page title="Historial" back="/">
      {views === undefined ? null : views.length === 0 ? (
        <p>Aún no has terminado ninguna sesión.</p>
      ) : (
        <List>
          {views.map((v) => (
            <SessionRow key={v.session.id} view={v} />
          ))}
        </List>
      )}
    </Page>
  )
}

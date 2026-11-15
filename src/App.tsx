import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router'
import ExerciseForm from './features/exercises/ExerciseForm'
import ExerciseList from './features/exercises/ExerciseList'
import ProgressList from './features/progress/ProgressList'
import Settings from './features/settings/Settings'
import Home from './features/workout/Home'
import { TabLayout } from './ui/TabLayout'

// HashRouter: hosting estático sin reescrituras de rutas.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="exercises" element={<ExerciseList />} />
          <Route path="progress" element={<ProgressList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="exercises/new" element={<ExerciseForm />} />
        <Route path="exercises/:id/edit" element={<ExerciseForm />} />
        {/* El detalle del ejercicio llega en la Fase 4; mientras, se edita. */}
        <Route path="exercises/:id" element={<RedirectToEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function RedirectToEdit() {
  const { id } = useParams()
  return <Navigate to={`/exercises/${id}/edit`} replace />
}

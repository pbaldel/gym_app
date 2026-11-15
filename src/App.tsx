import { HashRouter, Navigate, Route, Routes } from 'react-router'
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

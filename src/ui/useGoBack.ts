import { useLocation, useNavigate } from 'react-router'

/** Vuelve atrás si se llegó navegando dentro de la app; si no, va a `fallback`. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (location.key !== 'default') navigate(-1)
    else navigate(fallback, { replace: true })
  }
}

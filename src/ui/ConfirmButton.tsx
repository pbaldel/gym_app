import { useEffect, useState } from 'react'
import { BigButton } from './BigButton'

interface ConfirmButtonProps {
  label: string
  /** Texto del segundo toque, p. ej. "¿Seguro? Toca otra vez". */
  confirmLabel: string
  onConfirm: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

const ARM_MS = 3000

/**
 * Acción que pide confirmación con un segundo toque (sin diálogos modales).
 * Si no se confirma en 3 s, vuelve a su estado normal.
 */
export function ConfirmButton({ label, confirmLabel, onConfirm, variant = 'danger', disabled }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), ARM_MS)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <BigButton
      variant={armed ? 'danger' : variant}
      disabled={disabled}
      aria-live="polite"
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? confirmLabel : label}
    </BigButton>
  )
}

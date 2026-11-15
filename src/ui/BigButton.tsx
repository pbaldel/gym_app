import type { ButtonHTMLAttributes } from 'react'
import styles from './BigButton.module.css'

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  /** Alto: 56 px por defecto, 64 px para la acción principal de la pantalla. */
  size?: 'md' | 'lg'
}

/** Botón de ancho completo para las acciones principales. */
export function BigButton({ variant = 'primary', size = 'md', className, type = 'button', ...rest }: BigButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...rest} />
}

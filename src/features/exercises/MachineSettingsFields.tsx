import type { MachineField, MachineSettingsFields as Fields } from '../../domain/exerciseForm'
import styles from './ExerciseForm.module.css'

const GRID_FIELDS: { key: Exclude<MachineField, 'notes'>; label: string; placeholder: string }[] = [
  { key: 'seat', label: 'Asiento', placeholder: '4' },
  { key: 'backrest', label: 'Respaldo', placeholder: '2' },
  { key: 'rollers', label: 'Rodillos', placeholder: 'agujero 3' },
  { key: 'grip', label: 'Agarre', placeholder: 'neutro' },
]

interface Props {
  value: Fields
  onChange: (next: Fields) => void
}

/** Ajustes de máquina en texto libre: cuadrícula 2×2 y notas. */
export function MachineSettingsFields({ value, onChange }: Props) {
  const set = (key: MachineField, text: string) => onChange({ ...value, [key]: text })
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Ajustes de máquina</legend>
      <div className={styles.grid}>
        {GRID_FIELDS.map((f) => (
          <label key={f.key} className={styles.cell}>
            <span className={styles.cellLabel}>{f.label}</span>
            <input
              className={styles.cellInput}
              value={value[f.key] ?? ''}
              placeholder={f.placeholder}
              aria-label={f.label}
              onChange={(e) => set(f.key, e.target.value)}
              autoComplete="off"
              enterKeyHint="next"
            />
          </label>
        ))}
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Notas de la máquina</span>
        <textarea
          className={styles.textarea}
          rows={2}
          value={value.notes ?? ''}
          placeholder="Pies a la altura de la marca roja…"
          onChange={(e) => set('notes', e.target.value)}
        />
      </label>
    </fieldset>
  )
}

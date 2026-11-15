import { useState } from 'react'
import { saveMachineSettings } from '../../db/repositories/exercises'
import { cleanMachineSettings, type MachineField, type MachineSettingsFields } from '../../domain/exerciseForm'
import type { Id, MachineSettings } from '../../domain/types'
import styles from './MachineSettingsCard.module.css'

const GRID: { key: Exclude<MachineField, 'notes'>; label: string }[] = [
  { key: 'seat', label: 'Asiento' },
  { key: 'backrest', label: 'Respaldo' },
  { key: 'rollers', label: 'Rodillos' },
  { key: 'grip', label: 'Agarre' },
]

function toFields(s: MachineSettings | undefined): MachineSettingsFields {
  return { seat: s?.seat, backrest: s?.backrest, rollers: s?.rollers, grip: s?.grip, notes: s?.notes }
}

function sameFields(a: MachineSettingsFields, b: MachineSettingsFields) {
  return JSON.stringify(cleanMachineSettings(a)) === JSON.stringify(cleanMachineSettings(b))
}

interface Props {
  exerciseId: Id
  settings: MachineSettings | undefined
}

/**
 * Ajustes de máquina en la pantalla de registro: cuadrícula 2×2 con números grandes,
 * editable en línea. Guarda al salir de cada campo.
 */
export function MachineSettingsCard({ exerciseId, settings }: Props) {
  const [fields, setFields] = useState<MachineSettingsFields>(() => toFields(settings))
  const [saved, setSaved] = useState(false)

  async function save() {
    if (sameFields(fields, toFields(settings))) return
    await saveMachineSettings(exerciseId, fields)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const set = (key: MachineField, value: string) => setFields((f) => ({ ...f, [key]: value }))

  return (
    <section className={styles.card} aria-label="Ajustes de máquina">
      <header className={styles.header}>
        <span>Ajustes de máquina</span>
        {saved && <span className={styles.saved}>✓ Guardado</span>}
      </header>
      <div className={styles.grid}>
        {GRID.map((f) => (
          <label key={f.key} className={styles.cell}>
            <span className={styles.label}>{f.label}</span>
            <input
              className={styles.value}
              value={fields[f.key] ?? ''}
              placeholder="–"
              aria-label={f.label}
              onChange={(e) => set(f.key, e.target.value)}
              onBlur={() => void save()}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              autoComplete="off"
              enterKeyHint="done"
            />
          </label>
        ))}
      </div>
      <input
        className={styles.notes}
        value={fields.notes ?? ''}
        placeholder="Notas de la máquina"
        aria-label="Notas de la máquina"
        onChange={(e) => set('notes', e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        autoComplete="off"
        enterKeyHint="done"
      />
    </section>
  )
}

import type { ExerciseType } from '../../domain/types'
import { FINE_WEIGHT_STEP, RPE_VALUES, type SetValues } from '../../domain/workout'
import { formatWeight, parseDecimal } from '../../lib/format'
import { BigButton } from '../../ui/BigButton'
import { Chip, ChipRow } from '../../ui/Chip'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { Stepper } from '../../ui/Stepper'
import styles from './LogExercise.module.css'

interface Props {
  type: ExerciseType
  values: SetValues
  onChange: (values: SetValues) => void
  weightStep: number
  /** "la serie 2", "el calentamiento"… o null si se está añadiendo una nueva. */
  editingLabel: string | null
  justSaved: boolean
  onSave: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onCancelEdit: () => void
}

const parseReps = (text: string) => (/^\d{1,3}$/.test(text.trim()) ? Number(text.trim()) : null)

/** Panel fijo abajo: peso, reps, RPE, calentamiento y "Guardar serie". */
export function SetPanel({
  type,
  values,
  onChange,
  weightStep,
  editingLabel,
  justSaved,
  onSave,
  onSaveEdit,
  onDelete,
  onCancelEdit,
}: Props) {
  const patch = (p: Partial<SetValues>) => onChange({ ...values, ...p })
  const editing = editingLabel !== null

  return (
    <div className={editing ? `${styles.panel} ${styles.panelEditing}` : styles.panel}>
      {editing && <div className={styles.editBanner}>Editando {editingLabel}</div>}

      <Stepper
        label={type === 'peso_corporal' ? 'Lastre' : 'Peso'}
        unit="kg"
        value={values.weight}
        onChange={(weight) => patch({ weight })}
        step={weightStep}
        fineStep={FINE_WEIGHT_STEP}
        format={formatWeight}
        parse={parseDecimal}
        inputMode="decimal"
      />
      <Stepper
        label="Reps"
        value={values.reps}
        onChange={(reps) => patch({ reps })}
        step={1}
        min={1}
        format={String}
        parse={parseReps}
        inputMode="numeric"
      />

      <ChipRow scroll>
        <Chip selected={values.isWarmup} onClick={() => patch({ isWarmup: !values.isWarmup })}>
          Calent.
        </Chip>
        <span className={styles.rpeLabel}>RPE</span>
        <Chip selected={values.rpe === undefined} onClick={() => patch({ rpe: undefined })}>
          –
        </Chip>
        {RPE_VALUES.map((r) => (
          <Chip key={r} selected={values.rpe === r} onClick={() => patch({ rpe: values.rpe === r ? undefined : r })}>
            {formatWeight(r)}
          </Chip>
        ))}
      </ChipRow>

      {editing ? (
        <div className={styles.editActions}>
          <BigButton variant="secondary" onClick={onCancelEdit}>
            Cancelar
          </BigButton>
          <ConfirmButton label="Borrar" confirmLabel="¿Borrar?" variant="danger" onConfirm={onDelete} />
          <BigButton onClick={onSaveEdit}>Guardar</BigButton>
        </div>
      ) : (
        <BigButton size="lg" className={justSaved ? styles.saved : undefined} onClick={onSave}>
          {justSaved ? '✓ Serie guardada' : values.isWarmup ? 'Guardar calentamiento' : 'Guardar serie'}
        </BigButton>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import Button from '@/Components/Common/Button'
import { Label } from '@/Components/Common/Label'
import DatePickerField from '@/Components/Common/DatePickerField'
import { Autocomplete, TextField } from '@mui/material'
import { useWorkShiftForm } from '@/Hooks/Crm/useWorkShiftForm'
import { useOpeningHour } from '@/Hooks/Crm/useOpeningHour'
import { userService } from '@/Services/auth/UserService'
import type { WorkShiftInterface, WorkShiftFormValues } from '@/Interfaces/Crm/WorkShiftInterface'
import '@/Styles/Crm/WorkShiftModal.css'
import { parse } from 'date-fns'
import type { Dayjs } from 'dayjs'

interface WorkShiftModalProps {
  mode: 'create' | 'update' | 'view'
  isOpen: boolean
  data?: WorkShiftInterface | null
  onClose: () => void
  onSubmit: (values: WorkShiftFormValues) => void | Promise<void>
}

export default function WorkShiftModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: WorkShiftModalProps) {
  const { openingHours } = useOpeningHour()
  const [agents, setAgents] = useState<{ userId: number; fullName: string }[]>([])
  const {
    form,
    errors,
    isView,
    handleSelectOpeningHour,
    handleSelectUser,
    handleDate,
    handleCheckbox,
    handleSubmit,
    loading
  } = useWorkShiftForm({ mode, data, onSubmit })

  // Map weekday indices to names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const selected = openingHours.find(h => h.id === form.openingHourId)

  // Helper para convertir Dayjs | Date a Date
  const toDate = (value: Date | Dayjs): Date =>
    value instanceof Date ? value : (value as Dayjs).toDate()

  // Determine which dates are selectable based on the chosen opening hour
  const isDateEnabled = (value: Date | Dayjs): boolean => {
    const date = toDate(value)

    if (!selected) return false

    // Only allow today or future dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const compare = new Date(date)
    compare.setHours(0, 0, 0, 0)
    if (compare < today) return false

    const dayName = dayNames[date.getDay()]
    const day = date.getDate()
    const month = date.getMonth() + 1

    // Weekly schedule
    if (selected.recurrence === 'Weekly') {
      return selected.daysOfWeek?.includes(dayName) ?? false
    }

    // One-time holiday or date range
    if (selected.recurrence === 'OneTimeHoliday') {
      if (selected.holidayDate) {
        return day === selected.holidayDate.day && month === selected.holidayDate.month
      }

      if (selected.effectiveFrom && selected.effectiveTo) {
        const from = parse(selected.effectiveFrom, 'yyyy-MM-dd', new Date())
        const to = parse(selected.effectiveTo, 'yyyy-MM-dd', new Date())
        return date >= from && date <= to
      }

      return false
    }

    return false
  }

  const shouldDisableDate = (day: Date | Dayjs) => !isDateEnabled(day)

  // Fetch agents when modal opens
  useEffect(() => {
    if (isOpen) {
      userService.getAgentsByRoleAsync('support').then(list =>
        setAgents(list.data.map(x => ({ userId: x.userId, fullName: x.fullName })))
      )
    }
  }, [isOpen])

  const isHolidaySunday = (() => {
    if (
      !selected ||
      !['OneTimeHoliday', 'AnnualHoliday'].includes(selected.recurrence) ||
      !selected.holidayDate
    )
      return false

    const year = new Date().getFullYear()
    const holiday = new Date(year, selected.holidayDate.month - 1, selected.holidayDate.day)
    return holiday.getDay() === 0
  })()

  if (!isOpen) return null

  return (
    <div className="ws-modal__overlay">
      <div className="ws-modal__container crm-form">
        <header className="ws-modal__header">
          <div className="ws-modal__header-text">
            <h2 className="ws-modal__title">
              {mode === 'create'
                ? 'Asignar Turno'
                : mode === 'update'
                ? 'Editar Asignación de Turno'
                : 'Detalle Asignación de Turno'}
            </h2>
            <p className="ws-modal__subtitle">
              Asigna un horario y un agente al turno.
            </p>
          </div>
          <button type="button" className="ws-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <form className="ws-modal__body" onSubmit={handleSubmit}>
          <div className="ws-modal__grid">
            <div className="ws-modal__col">
              <Label >Horario</Label>
              <Autocomplete
                options={openingHours}
                getOptionLabel={h => h.name}
                value={openingHours.find(h => h.id === form.openingHourId) || null}
                onChange={(_, h) => handleSelectOpeningHour(h?.id || 0)}
                disabled={isView}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Horario"
                    size="small"
                  />
                )}
              />
              {errors.openingHourId && <div className="ws-modal__error">{errors.openingHourId}</div>}
            </div>

            <div className="ws-modal__col">
              <Label >Usuario asignado</Label>
              <Autocomplete
                options={agents}
                getOptionLabel={a => a.fullName}
                value={agents.find(a => a.userId === form.assignedUserId) || null}
                onChange={(_, a) => handleSelectUser(a?.userId || 0)}
                disabled={isView}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Usuario asignado"
                    size="small"
                    sx={{ fontSize: 16, padding: 0 }}
                  />
                )}
              />
              {errors.assignedUserId && (
                <div className="ws-modal__error">{errors.assignedUserId}</div>
              )}
            </div>

            <div className="ws-modal__col">
              <Label >Válido desde</Label>
              <DatePickerField
                label="Válido desde"
                value={form.validFrom as Date | null}
                onChange={date => handleDate('validFrom', date)}
                disabled={isView}
                shouldDisableDate={date => !isDateEnabled(date)}
                error={errors.validFrom}
              />
              {isHolidaySunday && (
                <p className="ws-modal__info">
                  <span className="ws-modal__info-span">Atención:</span> este feriado cae en domingo,
                  crear turno para el siguiente lunes hábil y asignar agente.
                </p>
              )}
            </div>

            <div className="ws-modal__col">
              <Label >Válido hasta</Label>
              <DatePickerField
                label="Válido hasta"
                value={(form.validTo as Date) || null}
                onChange={date => handleDate('validTo', date)}
                disabled={isView}
                shouldDisableDate={date => !isDateEnabled(date)}
                error={errors.validTo}
              />
              {isHolidaySunday && (
                <p className="ws-modal__info">
                  <span className="ws-modal__info-span">Atención:</span> este feriado cae en domingo,
                  crear turno para el siguiente lunes hábil y asignar agente.
                </p>
              )}
            </div>

            <div className="ws-modal__col">
              <label className="ws-modal__field--checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleCheckbox}
                  disabled={isView}
                />
                Activo
              </label>
            </div>

            {/* Timestamps (View Mode) */}
            {isView && data && (
              <div className="ws-modal__col ws-modal__col--full ws-modal__timestamps">
                <TextField
                  value={new Date(data.createdAt).toLocaleString()}
                  label="Creado"
                  disabled
                  fullWidth
                />
                {data.updatedAt && (
                  <TextField
                    value={new Date(data.updatedAt).toLocaleString()}
                    label="Actualizado"
                    disabled
                    fullWidth
                  />
                )}
              </div>
            )}
          </div>

          <footer className="ws-modal__footer">
            <Button
              variant="secondary"
              onClick={onClose}
              className="ws-modal__btn ws-modal__btn--cancel"
              disabled={loading}
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="ws-modal__btn ws-modal__btn--confirm"
                loading={loading}
              >
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
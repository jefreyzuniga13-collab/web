import { useEffect, useState } from 'react'
import Button from '@/Components/Common/Button'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Autocomplete, TextField } from '@mui/material'
import { useWorkShiftForm } from '@/Hooks/Setting/useWorkShiftForm'
import { useOpeningHour } from '@/Hooks/Setting/useOpeningHour'
import { userService } from '@/Services/User/UserService'
import type { WorkShiftInterface, WorkShiftFormValues } from '@/Interfaces/Setting/WorkShiftInterface'
import '@/Styles/Setting/WorkShiftModal.css'
import { parse } from 'date-fns'

interface WorkShiftModalProps {
  mode: 'create' | 'update' | 'view'
  isOpen: boolean
  data?: WorkShiftInterface | null
  onClose: () => void
  onSubmit: (values: WorkShiftFormValues) => void
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
  } = useWorkShiftForm({ mode, data, onSubmit })

  // Map weekday indices to names
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  // Determine which dates are selectable based on the chosen opening hour
  const selected = openingHours.find(h => h.id === form.openingHourId)

   const isDateEnabled = (date: Date) => {
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
        const from = parse(selected.effectiveFrom, "yyyy-MM-dd", new Date());
        const to   = parse(selected.effectiveTo,   "yyyy-MM-dd", new Date());
        return date >= from && date <= to
      }
      
      return false
    }

    return false
  }

  const shouldDisableDate = (date: Date) => !isDateEnabled(date)

  // Fetch agents when modal opens
  useEffect(() => {
    if (isOpen) {
      userService.getAgentsByRoleAsync('support').then(list =>
        setAgents(list.map(x => ({ userId: x.userId, fullName: x.fullName })))
      )
    }
  }, [isOpen])

   const isHolidaySunday = (() => {
    if (!selected || !['OneTimeHoliday', 'AnnualHoliday'].includes(selected.recurrence) || !selected.holidayDate) return false
    const year = new Date().getFullYear()
    const holiday = new Date(year, selected.holidayDate.month - 1, selected.holidayDate.day)
    return holiday.getDay() === 0
  })()

  // Fetch agents when modal opens
  useEffect(() => {
    if (isOpen) {
      userService.getAgentsByRoleAsync('support').then(list =>
        setAgents(list.map(x => ({ userId: x.userId, fullName: x.fullName })))
      )
    }
  }, [isOpen])
  if (!isOpen) return null

  return (
    <div className="ws-modal__overlay">
      <div className="ws-modal__container">
        <header className="ws-modal__header">
          <h2 className="ws-modal__title">
            {mode === 'create' ? 'Asignar Turno' : mode === 'update' ? 'Editar Asignación de Turno' : 'Detalle Asignación de Turno'}
          </h2>
          <button type="button" className="ws-modal__close" onClick={onClose}>×</button>
        </header>
        <form className="ws-modal__body" onSubmit={handleSubmit}>
          <div className="ws-modal__grid">

            <div className="ws-modal__col">
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
                    error={!!errors.openingHourId}
                    helperText={errors.openingHourId}
                  />
                )}
              />
            </div>

            <div className="ws-modal__col">
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
                    error={!!errors.assignedUserId}
                    helperText={errors.assignedUserId}
                  />
                )}
              />
            </div>

            {/* Date Picker */}
            <div className="ws-modal__col">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Valido desde"
                  value={form.validFrom as Date | null}
                  onChange={d => handleDate('validFrom', d)}
                  disabled={isView}
                  format="dd/MM/yyyy"
                  shouldDisableDate={shouldDisableDate}
                  slotProps={{ textField: { className: 'date-picker-field', fullWidth: true } }}
                />
              </LocalizationProvider>
               {isHolidaySunday && (
                <p className="ws-modal__info">
                  <span className="ws-modal__info-span">Atención:</span> este feriado cae en domingo, crear turno para el siguiente lunes hábil y asignar agente.
                </p>
              )}
              {errors.validFrom && <div className="ws-modal__error">{errors.validFrom}</div>}
            </div>

            <div className="ws-modal__col">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Valido hasta"
                  value={form.validTo as Date | null}
                  onChange={d => handleDate('validTo', d)}
                  disabled={isView}
                  format="dd/MM/yyyy"
                  shouldDisableDate={shouldDisableDate}
                  slotProps={{ textField: { className: 'date-picker-field', fullWidth: true } }}
                />
              </LocalizationProvider>
               {isHolidaySunday && (
                <p className="ws-modal__info">
                  <span className="ws-modal__info-span">Atención:</span> este feriado cae en domingo, crear turno para el siguiente lunes hábil y asignar agente.
                </p>
              )}
              {errors.validTo && <div className="ws-modal__error">{errors.validTo}</div>}
            </div>

            <div className="ws-modal__col">
              <label className="ws-modal__field--checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleCheckbox}
                  disabled={isView}
                /> Activo
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
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="ws-modal__btn ws-modal__btn--confirm"
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
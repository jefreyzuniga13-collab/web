/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import DatePickerField from '@/Components/Common/DatePickerField'
import TimePickerField from '@/Components/Common/TimePickerField'
import { useOpeningHourForm } from '@/Hooks/Crm/useOpeningHourForm'
import '@/Styles/Crm/OpeningHourModal.css'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import type { Dayjs } from 'dayjs'

const WEEK_DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'] as const

interface OpeningHourModalProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: any
  onClose: () => void
  onSubmit: (values: any) => void
}

// Helper para convertir PickerValue (Date | Dayjs | null) a Date | null
const pickerValueToDate = (value: Date | Dayjs | null): Date | null => {
  if (!value) return null
  return value instanceof Date ? value : (value as Dayjs).toDate()
}

export default function OpeningHourModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: OpeningHourModalProps) {
  const {
    form,
    errors,
    isView,
    setForm,
    handleTextChange,
    handleCheckbox,
    handleRecurrence,
    toggleDay,
    handleSubmit,
  } = useOpeningHourForm({ mode, data, onSubmit })

  if (!isOpen) return null

  return (
    <div className="oh-modal__overlay">
      <div className="oh-modal__container">
        <header className="oh-modal__header">
          <h2 className="oh-modal__title">
            {mode === 'create' && 'Crear Horario'}
            {mode === 'edit'   && 'Editar Horario'}
            {mode === 'view'   && 'Detalle Horario'}
          </h2>
          <button type="button" className="oh-modal__close" onClick={onClose}>×</button>
        </header>
        <form className="oh-modal__body" onSubmit={handleSubmit}>
          <div className="oh-modal__grid">
            
            <div className="oh-modal__col">
              <label className="oh-modal__label">Nombre</label>
              <Input name="name" value={form.name} onChange={handleTextChange} disabled={isView} />
              {errors.name && <div className="oh-modal__error">{errors.name}</div>}
            </div>

            <div className="oh-modal__col">
              <label className="oh-modal__label">Descripción</label>
              <Input name="description" value={form.description} onChange={handleTextChange} disabled={isView} />
              {errors.description && <div className="oh-modal__error">{errors.description}</div>}
            </div>

            <div className="oh-modal__col">
              <p className="oh-modal__inline-label">Recurrencia</p>
              <select className="oh-modal__select" value={form.recurrence} onChange={handleRecurrence} disabled={isView}>
                <option value="Weekly">Semanal</option>
                {/* <option value="AnnualHoliday">Feriado Anual</option> */}
                <option value="OneTimeHoliday">Feriado</option>
              </select>
            </div>

            {form.recurrence === 'Weekly' &&(
              <>
                <div className="oh-modal__col oh-modal__col-isActive">
                  <label>
                    <input
                      type="checkbox"
                      name="isWorkShift"
                      checked={form.isWorkShift}
                      onChange={handleCheckbox}
                      disabled={isView}
                    />
                    ¿Es turno?
                  </label>
                </div>
              </>
            )}

            {(form.recurrence === 'Weekly' || form.recurrence === 'OneTimeHoliday') && (
              <>
                <div className="oh-modal__col oh-modal__col--full">
                  <div className="oh-modal__field--checkbox-group">
                    {WEEK_DAYS.map(day => (
                      <label key={day} className="oh-modal__checkbox">
                        <input
                          type="checkbox"
                          checked={form.daysOfWeek.includes(day)}
                          onChange={() => toggleDay(day)}
                          disabled={isView}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                  {errors.days && <div className="oh-modal__error">{errors.days}</div>}
                </div>
                
                <div className="oh-modal__col">
                  <TimePickerField
                    label="Hora inicio"
                    value={form.startTime}
                    onChange={d => setForm(f => ({ ...f, startTime: d }))}
                    disabled={isView}
                  />
                </div>
                <div className="oh-modal__col">
                  <TimePickerField
                    label="Hora fin"
                    value={form.endTime}
                    onChange={d => setForm(f => ({ ...f, endTime: d }))}
                    disabled={isView}
                  />
                </div>
                {errors.time && <div className="oh-modal__error">{errors.time}</div>}
              </>
            )}

            {form.recurrence === 'OneTimeHoliday' && (
              <>
                <div className="oh-modal__col">
                  <p className="oh-modal__inline-label">¿Es feriado fijo dd/MM?</p>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Día feriado"
                      value={form.holidayDate}
                      onChange={d =>
                        setForm(f => ({
                          ...f,
                          holidayDate: pickerValueToDate(d as Date | Dayjs | null),
                        }))
                      }
                      disabled={isView}
                      format="dd/MM"
                    />
                  </LocalizationProvider>
                  {errors.holidayDate && <div className="oh-modal__error">{errors.holidayDate}</div>}
                </div>
              </>
            )}

            <div className="oh-modal__col oh-modal__col--full oh-modal__field--checkbox">
              <label>
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

            {isView && (
              <div className="oh-modal__col oh-modal__col--full oh-modal__timestamps">
                {form.recurrence === 'OneTimeHoliday' && (
                  <>
                    <DatePickerField
                      label="Fecha feriado oficial"
                      value={form.holidayMovedFrom ? form.holidayMovedFrom : null}
                      onChange={() => {}}
                      disabled
                    />
                    <DatePickerField
                      label="Fecha feriado transladada"
                      value={form.holidayMoveTo ? form.holidayMoveTo : null}
                      onChange={() => {}}
                      disabled
                    />
                  </>
                )}
              </div>
            )}

            {isView && (
              <div className="oh-modal__col oh-modal__col--full oh-modal__timestamps">
                <DatePickerField
                  label="Creado"
                  value={form.createdAt}
                  onChange={() => {}}
                  disabled
                />
                <DatePickerField
                  label="Actualizado"
                  value={form.updatedAt}
                  onChange={() => {}}
                  disabled
                />
              </div>
            )}
          </div>

          <footer className="oh-modal__footer">
            <Button
              variant="secondary"
              onClick={onClose}
              className="oh-modal__btn oh-modal__btn--cancel"
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="oh-modal__btn oh-modal__btn--confirm"
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
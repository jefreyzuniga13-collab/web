/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import DatePickerField from '@/Components/Common/DatePickerField'
import TimePickerField from '@/Components/Common/TimePickerField'
import { useOpeningHourForm } from '@/Hooks/Setting/useOpeningHourForm'
import '@/Styles/Setting/OpeningHourModal.css'

const WEEK_DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'] as const

interface OpeningHourModalProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: any
  onClose: () => void
  onSubmit: (values: any) => void
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
              <label className="oh-modal__label">Recurrencia</label>
              <select className="oh-modal__select" value={form.recurrence} onChange={handleRecurrence} disabled={isView}>
                <option value="Weekly">Semanal</option>
                <option value="AnnualHoliday">Feriado Anual</option>
                <option value="OneTimeHoliday">Feriado Único</option>
              </select>
            </div>

            {form.recurrence === 'Weekly' && (
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

            {form.recurrence === 'AnnualHoliday' && (
              <>
                <div className="oh-modal__col">
                  <DatePickerField
                    label="Día feriado"
                    value={form.holidayDate}
                    onChange={d => setForm(f => ({ ...f, holidayDate: d }))}
                    disabled={isView}
                  />
                  {errors.holidayDate && <div className="oh-modal__error">{errors.holidayDate}</div>}
                </div>

              </>
            )}

            {form.recurrence === 'OneTimeHoliday' && (
              <>
                <div className="oh-modal__col">
                   <p className="oh-modal__inline-label">¿Es feriado corto?</p>
                  <DatePickerField
                    label="Fecha específica"
                    value={form.specificDate}
                    onChange={d => setForm(f => ({ ...f, specificDate: d }))}
                    disabled={isView}
                  />
                  {errors.specificDate && <div className="oh-modal__error">{errors.specificDate}</div>}
                </div>
                
                <div className="oh-modal__col oh-modal__col--full">
                  <p className="oh-modal__inline-label">¿Es feriado largo?</p>
                  <div className="oh-modal__input-container">
                    <div className="oh-modal__col">
                      <DatePickerField
                        label="Desde"
                        value={form.effectiveFrom}
                        onChange={d => setForm(f => ({ ...f, effectiveFrom: d }))}
                        disabled={isView}
                      />
                    </div>
                    <div className="oh-modal__col">
                      <DatePickerField
                        label="Hasta"
                        value={form.effectiveTo}
                        onChange={d => setForm(f => ({ ...f, effectiveTo: d }))}
                        disabled={isView}
                      />
                    </div>
                  </div>
                  {errors.range && <div className="oh-modal__error">{errors.range}</div>}
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
                <DatePickerField label="Creado"     value={form.createdAt}   onChange={() => {}} disabled />
                <DatePickerField label="Actualizado" value={form.updatedAt}   onChange={() => {}} disabled />
              </div>
            )}
          </div>

          <footer className="oh-modal__footer">
            <Button variant="secondary" onClick={onClose} className="oh-modal__btn oh-modal__btn--cancel">
              Cancelar
            </Button>
            {!isView && (
              <Button variant="primary" type="submit" className="oh-modal__btn oh-modal__btn--confirm">
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
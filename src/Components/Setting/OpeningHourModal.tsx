import React, { useState, useEffect, type FormEvent } from 'react'
import { parse, format } from 'date-fns'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import DatePickerField from '@/Components/Common/DatePickerField'
import TimePickerField from '@/Components/Common/TimePickerField'
import type {
  OpeningHourInterface,
  OpeningHourFormValues,
  OpeningHourFormState,
} from '@/Interfaces/Setting/OpeningHour'
import '@/Styles/Setting/OpeningHourModal.css'

const WEEK_DAYS = [
  'Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'
] as const

interface OpeningHourModalProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: OpeningHourInterface | null
  onClose: () => void
  onSubmit: (values: OpeningHourFormValues) => void
}

export default function OpeningHourModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: OpeningHourModalProps) {
  const isView = mode === 'view'

  const [form, setForm] = useState<OpeningHourFormState>({
    name: '',
    description: '',
    recurrence: 'Weekly',
    daysOfWeek: [],
    holidayDate: null,
    specificDate: null,
    startTime: null,
    endTime: null,
    effectiveFrom: null,
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  useEffect(() => {
    if ((mode === 'edit' || isView) && data) {
      setForm({
        name: data.name,
        description: data.description ?? '',
        recurrence: data.recurrence,
        daysOfWeek: data.daysOfWeek ?? [],
        holidayDate: data.holidayDate
          ? new Date(0, data.holidayDate.month - 1, data.holidayDate.day)
          : new Date(),
        specificDate: data.specificDate
          ? new Date(data.specificDate)
          : new Date(),
        startTime: data.startTime
          ? parse(data.startTime, 'HH:mm', new Date())
          : null,
        endTime: data.endTime
          ? parse(data.endTime, 'HH:mm', new Date())
          : null,
        effectiveFrom: data.effectiveFrom
          ? new Date(data.effectiveFrom)
          : new Date(),
        effectiveTo: data.effectiveTo
          ? new Date(data.effectiveTo)
          : new Date(),
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt ?? data.createdAt),
      })
    } else if (mode === 'create') {
      setForm(f => ({
        ...f,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    }
  }, [mode, data, isView])

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleCheckbox = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = e.target
    setForm(f => ({ ...f, [name]: checked }))
  }

  const handleRecurrence = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setForm(f => ({
      ...f,
      recurrence: e.target.value as OpeningHourFormState['recurrence'],
      daysOfWeek: [],
      holidayDate: new Date(),
      specificDate: new Date(),
      startTime: null,
      endTime: null,
    }))
  }

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day],
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const payload: OpeningHourFormValues = {
      name: form.name,
      description: form.description,
      recurrence: form.recurrence,
      daysOfWeek:
        form.recurrence === 'Weekly' ? form.daysOfWeek : null,
      holidayDate:
        form.recurrence === 'AnnualHoliday' && form.holidayDate
          ? {
              day: form.holidayDate.getDate(),
              month: form.holidayDate.getMonth() + 1,
            }
          : null,
      specificDate:
        form.recurrence === 'OneTimeHoliday' && form.specificDate
          ? form.specificDate
          : null,
      startTime:
        form.recurrence === 'Weekly' && form.startTime
          ? format(form.startTime, 'HH:mm')
          : null,
      endTime:
        form.recurrence === 'Weekly' && form.endTime
          ? format(form.endTime, 'HH:mm')
          : null,
      effectiveFrom: form.effectiveFrom ?? null,
      effectiveTo: form.effectiveTo ?? null,
      isActive: form.isActive,
    }

    onSubmit(payload)
  }

  if (!isOpen) return null

  return (
    <div className="oh-modal__overlay">
      <div className="oh-modal__container">
        <header className="oh-modal__header">
          <h2 className="oh-modal__title">
            {mode === 'create' && 'Crear Horario'}
            {mode === 'edit' && 'Editar Horario'}
            {mode === 'view' && 'Detalle Horario'}
          </h2>
          <button
            type="button"
            className="oh-modal__close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="oh-modal__body" onSubmit={handleSubmit}>
          <div className="oh-modal__grid">
            <div className="oh-modal__col">
              <label className="oh-modal__label">Nombre</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleTextChange}
                disabled={isView}
              />
            </div>

            <div className="oh-modal__col">
              <label className="oh-modal__label">Descripción</label>
              <Input
                name="description"
                value={form.description}
                onChange={handleTextChange}
                disabled={isView}
              />
            </div>

            <div className="oh-modal__col">
              <label className="oh-modal__label">Recurrencia</label>
              <select
                className="oh-modal__select"
                value={form.recurrence}
                onChange={handleRecurrence}
                disabled={isView}
              >
                <option value="Weekly">Semanal</option>
                <option value="AnnualHoliday">Feriado Anual</option>
                <option value="OneTimeHoliday">Feriado Único</option>
              </select>
            </div>

            <div className="oh-modal__col oh-modal__col--full">
              {form.recurrence === 'Weekly' && (
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
              )}
            </div>

            {form.recurrence === 'Weekly' && (
              <>
                <div className="oh-modal__col">
                  <TimePickerField
                    label="Hora inicio"
                    value={form.startTime}
                    onChange={d =>
                      setForm(f => ({ ...f, startTime: d }))
                    }
                    disabled={isView}
                  />
                </div>
                <div className="oh-modal__col">
                  <TimePickerField
                    label="Hora fin"
                    value={form.endTime}
                    onChange={d =>
                      setForm(f => ({ ...f, endTime: d }))
                    }
                    disabled={isView}
                  />
                </div>
              </>
            )}
  <div className='input-container'>
                        {form.recurrence !== 'Weekly' && (
               <>
                 <p className="oh-modal__inline-label">¿Es feriado?</p>
              <div className="oh-modal__col">
                <DatePickerField
                  label="Día feriado"
                  value={form.holidayDate}
                  onChange={d =>
                    setForm(f => ({ ...f, holidayDate: d }))
                  }
                  disabled={isView}
                />
              </div>
               </>
            )}
  </div>

            {form.recurrence === 'OneTimeHoliday' && (
              <div className="oh-modal__col">
                <DatePickerField
                  label="Fecha específica"
                  value={form.specificDate}
                  onChange={d =>
                    setForm(f => ({ ...f, specificDate: d }))
                  }
                  disabled={isView}
                />
              </div>
            )}

          {form.recurrence == "OneTimeHoliday" &&
          (
            <div className='input-container'>
                  <p className="oh-modal__inline-label">¿Es feriado largo? (Seleccione el rango)</p>
                <div className='oh-modal__input-container'>
                    <div className="oh-modal__col">
                      <DatePickerField
                        label="Vigencia desde"
                        value={form.effectiveFrom}
                        onChange={d =>
                          setForm(f => ({ ...f, effectiveFrom: d }))
                        }
                        disabled={isView}
                      />
                    </div>

                      <div className="oh-modal__col">
                      <DatePickerField
                            label="Vigencia hasta"
                            value={form.effectiveTo}
                            onChange={d =>
                              setForm(f => ({ ...f, effectiveTo: d }))
                            }
                            disabled={isView}
                          />
                  </div>
           </div>
            </div>
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
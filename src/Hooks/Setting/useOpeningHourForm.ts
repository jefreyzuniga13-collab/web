/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { parse, format } from 'date-fns'
import type {
  OpeningHourInterface,
  OpeningHourFormValues,
  OpeningHourFormState,
} from '@/Interfaces/Setting/OpeningHour'

export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

type Errors = {
  name?: string
  description?: string
  days?: string
  holidayDate?: string
  //specificDate?: string
  time?: string
  range?: string
}

interface UseOpeningHourFormParams {
  mode: 'create' | 'edit' | 'view'
  data?: OpeningHourInterface | null
  onSubmit: (values: OpeningHourFormValues) => void
}

const SPANISH_TO_ENGLISH: Record<string, DayOfWeek> = {
  Domingo: 'Sunday',
  Lunes: 'Monday',
  Martes: 'Tuesday',
  Miércoles: 'Wednesday',
  Jueves: 'Thursday',
  Viernes: 'Friday',
  Sábado: 'Saturday',
}

const ENGLISH_TO_SPANISH: Record<DayOfWeek, string> = {
  Sunday: 'Domingo',
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
}

export function useOpeningHourForm({
  mode,
  data,
  onSubmit,
}: UseOpeningHourFormParams) {
  const isView = mode === 'view'

  const initialForm: OpeningHourFormState = {
    name: '',
    description: '',
    recurrence: 'Weekly',
    daysOfWeek: [],
    holidayDate: null,
    //specificDate: null,
    startTime: null,
    endTime: null,
    effectiveFrom: null,
    effectiveTo: null,
    isWorkShift: true,
    isHolidayMoved: false,
    holidayMoveTo: null,
    holidayMovedFrom: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const [form, setForm] = useState<OpeningHourFormState>(initialForm)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if ((mode === 'edit' || isView) && data) {
      setForm({
        name: data.name,
        description: data.description ?? '',
        recurrence: data.recurrence,
        // Traducimos inglés → español para mostrar en checkboxes
        daysOfWeek: data.daysOfWeek
          ? (data.daysOfWeek as DayOfWeek[]).map(day => ENGLISH_TO_SPANISH[day])
          : [],
          // si usas holidayDate en DatePicker:
      holidayDate: data.holidayDate
        ? parse(
            `${String(data.holidayDate.day).padStart(2,'0')}/${String(data.holidayDate.month).padStart(2,'0')}`,
            'dd/MM',
            new Date()
          )
        : null,
        // specificDate: data.specificDate ? new Date(data.specificDate) : new Date(),
         startTime: data.startTime
          ? parse(data.startTime.slice(0, 8), 'HH:mm:ss', new Date())
          : null,
        endTime: data.endTime
          ? parse(data.endTime.slice(0, 8), 'HH:mm:ss', new Date())
          : null,
            
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isWorkShift: data.isWorkShift,
        isHolidayMoved: data.isHolidayMoved,
        holidayMoveTo: data.holidayMoveTo ? new Date(data.holidayMoveTo): null,
        holidayMovedFrom: data.holidayMovedFrom ? new Date(data.holidayMovedFrom): null,
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt ?? data.createdAt),
      })
    } else if (mode === 'create') {
      setForm({
        ...initialForm,
        effectiveFrom: new Date(),
        effectiveTo: new Date(),
      })
    }
  }, [mode, data, isView])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(f => ({ ...f, [name]: checked }))
  }

  const handleRecurrence = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({
      ...f,
      recurrence: e.target.value as OpeningHourFormState['recurrence'],
      daysOfWeek: [],
      holidayDate: null,
      // specificDate: null,
      startTime: null,
      endTime: null,
      effectiveFrom: null,
      effectiveTo: null,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Errors = {}

    if (!form.name.trim()) newErrors.name = 'Nombre es obligatorio.'
    else if (form.name.length < 3 || form.name.length > 50)
      newErrors.name = 'Nombre debe tener entre 3 y 50 caracteres.'

    if (form.description && form.description.length > 200)
      newErrors.description = 'Descripción no puede exceder 200 caracteres.'

    if (form.recurrence === 'Weekly') {
      if (form.daysOfWeek.length <= 0) newErrors.days = 'Seleccione al menos un día.'
      if (!form.startTime || !form.endTime)
        newErrors.time = 'Debe especificar hora de inicio y fin.'
      else if (form.startTime >= form.endTime)
        newErrors.time = 'Hora de inicio debe ser menor que hora de fin.'
    }

    // if (form.recurrence === 'AnnualHoliday') {
    //   if (!form.holidayDate)
    //     newErrors.holidayDate = 'Fecha de feriado anual es obligatoria.'
    //   if (
    //     form.effectiveFrom &&
    //     form.effectiveTo &&
    //     form.effectiveFrom > form.effectiveTo
    //   )
    //     newErrors.range = 'Desde debe ser anterior o igual a Hasta.'
    // }

    if (form.recurrence === 'OneTimeHoliday') {
      if (!form.holidayDate &&
         !form.effectiveFrom &&
        !form.effectiveTo 
      ){ newErrors.holidayDate = 'Seleccionar una fecha espesifica o rango.';
       newErrors.range = 'Seleccionar una fecha espesifica o rango.'}

      if (
        form.effectiveFrom &&
        form.effectiveTo &&
        form.effectiveFrom > form.effectiveTo
      ) newErrors.range = 'Desde debe ser anterior o igual a Hasta.'

      // if (
      //   form.effectiveFrom &&
      //   form.effectiveTo &&
      //   form.effectiveFrom < new Date() && form.effectiveFrom < new Date()
      // ) newErrors.range = 'Desde debe ser posterior o igual a Hasta.'
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    // Convertimos español → inglés antes de enviar
    const payload: OpeningHourFormValues = {
      name: form.name,
      description: form.description,
      recurrence: form.recurrence,
      daysOfWeek:
        form.recurrence === 'Weekly'
          ? form.daysOfWeek.map(spanish => SPANISH_TO_ENGLISH[spanish])
          : null,
      holidayDate:
        form.recurrence === 'OneTimeHoliday' && form.holidayDate
          ? {
              day: form.holidayDate.getDate(),
              month: form.holidayDate.getMonth() + 1,
            }
          : null,
      // specificDate:
      //   form.recurrence === 'OneTimeHoliday' && form.specificDate
      //     ? form.specificDate
      //     : null,
      startTime:
        form.recurrence === 'Weekly' && form.startTime
          ? format(form.startTime, 'HH:mm')
          : null,
      endTime:
        form.recurrence === 'Weekly' && form.endTime
          ? format(form.endTime, 'HH:mm')
          : null,
      effectiveFrom:
        form.recurrence === 'OneTimeHoliday' ? form.effectiveFrom : null,
      effectiveTo:
        form.recurrence === 'OneTimeHoliday' ? form.effectiveTo : null,
        isWorkShift: form.isWorkShift,
      isActive: form.isActive,
    }

    onSubmit(payload)

    if (mode === 'create') {
      setForm(initialForm)
      setErrors({})
    }
  }

  return {
    form,
    errors,
    isView,
    setForm,
    handleTextChange,
    handleCheckbox,
    handleRecurrence,
    toggleDay,
    handleSubmit,
  }
}
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { WorkShiftInterface, WorkShiftFormValues } from '@/Interfaces/Setting/WorkShiftInterface'

type Errors = {
  openingHourId?: string
  assignedUserId?: string
  validFrom?: string
  validTo?: string
  range?: string
}

interface UseWorkShiftFormParams {
  mode: 'create' | 'update' | 'view'
  data?: WorkShiftInterface | null
  onSubmit: (values: WorkShiftFormValues) => void
}

// Estado inicial del formulario

const initialForm: WorkShiftFormValues = {
  openingHourId: 0,
  assignedUserId: 0,
  validFrom: null,
  validTo: null,
  isActive: true,
}

export function useWorkShiftForm({ mode, data, onSubmit }: UseWorkShiftFormParams) {
  const isView = mode === 'view'
  const [form, setForm] = useState<WorkShiftFormValues>(initialForm)
  const [errors, setErrors] = useState<Errors>({})

  // Cargar datos iniciales según modo
  useEffect(() => {
    if ((mode === 'update' || isView) && data) {
      setForm({
        openingHourId: data.openingHourId,
        assignedUserId: data.assignedUserId,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive,
      })
    } else if (mode === 'create') {
      setForm(initialForm)
      setErrors({})
    }
  }, [mode, data, isView])

  // Handlers para inputs
  const handleSelectOpeningHour = (id: number) =>
    setForm(f => ({ ...f, openingHourId: id }))

  const handleSelectUser = (id: number) =>
    setForm(f => ({ ...f, assignedUserId: id }))

  const handleDate = (field: 'validFrom' | 'validTo', d: Date | null) =>
    setForm(f => ({ ...f, [field]: d }))

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, isActive: e.target.checked }))

  // Validación y envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Errors = {}

    if (!form.openingHourId) newErrors.openingHourId = 'Debe seleccionar un horario.'
    if (!form.assignedUserId) newErrors.assignedUserId = 'Debe asignar un usuario.'
    if (!form.validFrom) newErrors.validFrom = 'Fecha de inicio es obligatoria.'
    //if (!form.validFrom ) newErrors.validFrom = 'Fecha de inicio es obligatoria.'
    // if (!form.validTo) newErrors.validTo = 'Fecha de fin es obligatoria.'
    // if (
    //   form.validFrom &&
    //   form.validTo &&
    //   form.validFrom > form.validTo
    // ) {
    //   newErrors.range = 'Desde debe ser anterior o igual a Hasta.'
    // }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    const payload: WorkShiftFormValues = {
      openingHourId: form.openingHourId,
      assignedUserId: form.assignedUserId,
      validFrom: form.validFrom
        ? format(form.validFrom, 'yyyy-MM-dd')
        : null,
      validTo: form.validTo
        ? format(form.validTo, 'yyyy-MM-dd')
        : null,
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
    handleSelectOpeningHour,
    handleSelectUser,
    handleDate,
    handleCheckbox,
    handleSubmit,
  }
}
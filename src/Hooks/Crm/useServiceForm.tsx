import { useState, useEffect, type ChangeEvent, useCallback } from 'react'
import type { ServiceResponseDto, ServiceRequestDto } from '@/Interfaces/Crm/ServiceInterface'

type Errors = {
  name?: string
  descripcion?: string
}

interface Props {
  mode: 'create' | 'update' | 'view'
  data?: ServiceResponseDto | null
  onSubmit: (values: ServiceRequestDto) => void
}

// Estado inicial del formulario

const initialForm: ServiceRequestDto = {
  name: "",
  description: "",
  isActive: true,
}

export function useServiceForm({ mode, data, onSubmit }: Props) {
  const isView = mode === 'view'
  const [form, setForm] = useState<ServiceRequestDto>(initialForm)
  const [errors, setErrors] = useState<Errors>({})

  // Cargar datos iniciales según modo
  useEffect(() => {
    if ((mode === 'update' || isView) && data) {
      setForm({
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      })
    } else if (mode === 'create') {
      setForm(initialForm)
      setErrors({})
    }
  }, [mode, data, isView])

  // Handlers para inputs

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
      },
      []
    )

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, isActive: e.target.checked }))

  // Validación y envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Errors = {}

    if (!form.name) newErrors.name = 'Debe seleccionar un horario.'
    if (!form.description) newErrors.descripcion = 'Debe asignar un usuario.'

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    const payload: ServiceRequestDto = {
      name: form.name,
      description: form.description,
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
    handleChange,
    handleCheckbox,
    handleSubmit,
  }
}
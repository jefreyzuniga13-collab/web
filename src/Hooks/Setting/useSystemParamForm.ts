import { useState, useEffect, useCallback } from 'react'
import type { SystemParamRequestDto, SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'

interface UseSystemParamFormParams {
  mode: 'create' | 'edit' | 'view'
  data?: SystemParamResponseDto | null
  onSubmit: (values: SystemParamRequestDto) => void
}

export function useSystemParamForm({ mode, data, onSubmit }: UseSystemParamFormParams) {
  const isView = mode === 'view'

  const initialForm: SystemParamRequestDto = {
    id: data?.id || 0,
    name: '',
    type: '',
    value: '',
    description: '',
  }

  const [form, setForm] = useState<SystemParamRequestDto>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if ((mode === 'edit' || isView) && data) {
      setForm({
        id: data.id,
        name: data.name,
        type: data.type,
        value: data.value,
        description: data.description || '',
      })
    } else if (mode === 'create') {
      setForm(initialForm)
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio'
    if (!form.type) newErrors.type = 'El tipo es obligatorio'
    if (!form.value.trim()) newErrors.value = 'El valor es obligatorio'
    if (!form.description.trim()) newErrors.description = 'La descripción es obligatoria'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setForm(prev => ({ ...prev, [name]: value }))
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
    },
    [errors]
  )

  const handleSelect = useCallback(
    (value: string) => {
      setForm(prev => ({ ...prev, type: value }))
      if (errors.type) {
        setErrors(prev => ({ ...prev, type: '' }))
      }
    },
    [errors]
  )

  const handleSubmitForm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return
      onSubmit(form)
    },
    [form, onSubmit, validate]
  )

  return {
    form,
    errors,
    isView,
    handleChange,
    handleSelect,
    handleSubmit: handleSubmitForm,
  }
}
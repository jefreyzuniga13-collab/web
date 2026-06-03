import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import type { LicenseProj, LicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import type { ModalMode } from '@/Interfaces/Common/GlobalInterface'

interface Args {
  mode: ModalMode
  data?: LicenseProj | null
  onSubmit: (values: LicenseRequest) => void
}

interface FormErrors {
  name: string
  description: string
  licensePeriodId: string
}

const initialForm: LicenseRequest = {
  name: '',
  description: '',
  isActive: true,
  benefits: [],
  isRecurrent: true,
  licensePeriodId: 0,
  duration: 1
}

const initialErrors: FormErrors = {
  name: '',
  description: '',
  licensePeriodId: ''
}

const normalizeBenefits = (benefits: unknown): string[] => {
  if (Array.isArray(benefits)) return benefits

  if (typeof benefits === 'string') {
    try {
      const parsed = JSON.parse(benefits)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

export function useLicenseForm({ mode, data, onSubmit }: Args) {
  const isView = mode === 'view'

  const [form, setForm] = useState<LicenseRequest>(initialForm)
  const [errors, setErrors] = useState<FormErrors>(initialErrors)

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && data) {
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        isActive: data.isActive ?? true,
        benefits: normalizeBenefits(data.benefits),
        isRecurrent: data.isRecurrent ?? true,
        licensePeriodId: data.licensePeriodId ?? 0,
        duration: data.duration ?? 1
      })
    } else {
      setForm(initialForm)
      setErrors(initialErrors)
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const errs: FormErrors = {
      name: '',
      description: '',
      licensePeriodId: ''
    }

    if (!form.name.trim()) {
      errs.name = 'Nombre es obligatorio'
    }

    if (!form.description.trim()) {
      errs.description = 'La descripción es obligatoria'
    }

    if (form.isRecurrent && (!form.licensePeriodId || form.licensePeriodId <= 0)) {
      errs.licensePeriodId = 'El periodo de licencia es obligatorio'
    }

    setErrors(errs)

    return !errs.name && !errs.description && !errs.licensePeriodId
  }, [form.name, form.description, form.isRecurrent, form.licensePeriodId])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target

      setForm(prev => ({
        ...prev,
        [name]: name === 'duration' || name === 'licensePeriodId'
          ? Number(value)
          : value
      }))
    },
    []
  )

  const handleCheckbox = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target

    setForm(prev => ({
      ...prev,
      [name]: checked,
      ...(name === 'isRecurrent' && !checked
        ? {
            licensePeriodId: 0,
            duration: 1
          }
        : {})
    }))
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()

      if (isView) return

      if (validate()) {
        onSubmit({
          ...form,
          benefits: normalizeBenefits(form.benefits),
          licensePeriodId: form.isRecurrent ? form.licensePeriodId : 0,
          duration: form.duration && form.duration > 0 ? form.duration : 1
        })
      }
    },
    [form, isView, onSubmit, validate]
  )

  return {
    form,
    errors,
    isView,
    handleChange,
    handleCheckbox,
    handleSubmit,
    setForm
  }
}
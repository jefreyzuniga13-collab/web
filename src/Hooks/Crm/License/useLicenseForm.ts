import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import type { LicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import type { ModalMode } from '@/Interfaces/Common/GlobalInterface'

interface Args {
  mode: ModalMode
  data?: LicenseRequest | null
  onSubmit: (values: LicenseRequest) => void
}

interface FormErrors {
  name: string
  description: string
}

const initialForm: LicenseRequest = {
  name: '',
  description: '',
  isActive: true
}

const initialErrors: FormErrors = {
  name: '',
  description: ''
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
        isActive: data.isActive ?? true
      })
    } else {
      setForm(initialForm)
      setErrors(initialErrors)
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const errs: FormErrors = {
      name: '',
      description: ''
    }

    if (!form.name.trim()) {
      errs.name = 'Nombre es obligatorio'
    }

    if (!form.description.trim()) {
      errs.description = 'La descripción es obligatoria'
    }

    setErrors(errs)

    return !errs.name && !errs.description
  }, [form])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }, [])

  const handleCheckbox = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(f => ({ ...f, [name]: checked }))
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()

      if (isView) return

      if (validate()) {
        onSubmit(form)
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
    handleSubmit
  }
}
import { useCallback, useEffect, useState } from 'react'
import type {CompanySystemParamProj, CompanySystemParamRequest} from '@/Interfaces/Crm/CompanySystemParams'

interface UseCompanySystemParamFormParams {
  mode: 'create' | 'edit' | 'view'
  data?: CompanySystemParamProj | null
  onSubmit: (values: CompanySystemParamRequest) => void | Promise<void>
}

const initialForm: CompanySystemParamRequest = {
  companyId: 0,
  systemParamId: 0,
  metaChannelId: 0,
  isActive: true,
  value: '',
}

export function useCompanySystemParamForm({
  mode,
  data,
  onSubmit,
}: UseCompanySystemParamFormParams) {
  const isView = mode === 'view'

  const [form, setForm] = useState<CompanySystemParamRequest>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && data) {
      setForm({
        companyId: data.companyId,
        systemParamId: data.systemParamId,
        metaChannelId: data.metaChannelId,
        isActive: data.isActive,
        value: data.value ?? '',
      })
      setErrors({})
      return
    }

    if (mode === 'create') {
      setForm(initialForm)
      setErrors({})
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!form.companyId || form.companyId <= 0) {
      newErrors.companyId = 'La empresa es obligatoria'
    }

    if (!form.systemParamId || form.systemParamId <= 0) {
      newErrors.systemParamId = 'El parámetro es obligatorio'
    }

    if (!form.metaChannelId || form.metaChannelId <= 0) {
      newErrors.metaChannelId = 'El canal es obligatorio'
    }

    if (!form.value.trim()) {
      newErrors.value = 'El valor es obligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const setField = useCallback(
    <K extends keyof CompanySystemParamRequest>(
      name: K,
      value: CompanySystemParamRequest[K]
    ) => {
      setForm((prev) => ({ ...prev, [name]: value }))

      if (errors[name as string]) {
        setErrors((prev) => ({ ...prev, [name]: '' }))
      }
    },
    [errors]
  )

  const handleSelectNumber = useCallback(
    (name: keyof CompanySystemParamRequest, value: string) => {
      setField(name, Number(value || 0) as never)
    },
    [setField]
  )

  const handleValueChange = useCallback(
    (value: string) => {
      setField('value', value)
    },
    [setField]
  )

  const handleActiveChange = useCallback(
    (checked: boolean) => {
      setField('isActive', checked)
    },
    [setField]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (isView) return
      if (!validate()) return

      setLoading(true)

      try {
        await onSubmit(form)
        setErrors({})
      } finally {
        setLoading(false)
      }
    },
    [form, isView, validate, onSubmit]
  )

  return {
    form,
    errors,
    loading,
    isView,
    setField,
    handleSelectNumber,
    handleValueChange,
    handleActiveChange,
    handleSubmit,
  }
}
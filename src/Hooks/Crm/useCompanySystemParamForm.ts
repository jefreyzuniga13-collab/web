import { useCallback, useEffect, useState } from 'react'
import type {
  CompanySystemParamProj,
  CompanySystemParamRequest,
  SystemParamType,
} from '@/Interfaces/Crm/CompanySystemParams'

interface UseCompanySystemParamFormParams {
  mode: 'create' | 'edit' | 'view'
  data?: CompanySystemParamProj | null
  systemParamType?: SystemParamType | string
  onSubmit: (values: CompanySystemParamRequest) => void | Promise<void>
}

const initialForm: CompanySystemParamRequest = {
  companyId: 0,
  systemParamId: 0,
  metaChannelId: 0,
  isActive: true,
  value: '',
}

const parseKeywords = (raw: string): string[] => {
  if (!raw.trim()) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

const isValidJsonArrayString = (raw: string) => {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
  } catch {
    return false
  }
}

export function useCompanySystemParamForm({
  mode,
  data,
  systemParamType,
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

  useEffect(() => {
    if (!systemParamType) return
    if (mode !== 'create') return

    setForm((prev) => {
      if (systemParamType === 'Conditional') {
        return {
          ...prev,
          value: '',
        }
      }

      if (systemParamType === 'Keywords') {
        return {
          ...prev,
          value: '[]',
        }
      }

      return prev
    })

    setErrors((prev) => ({
      ...prev,
      value: '',
    }))
  }, [systemParamType, mode])

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

    if (!systemParamType) {
      newErrors.value = 'No se pudo identificar el tipo del parámetro'
    }

    if (systemParamType === 'Prompts') {
      if (!form.value.trim()) {
        newErrors.value = 'El mensaje es obligatorio'
      }
    }

    if (systemParamType === 'Temp') {
      if (!form.value.trim()) {
        newErrors.value = 'El tiempo es obligatorio'
      } else if (!/^[1-9]\d*$/.test(form.value.trim())) {
        newErrors.value = 'El tiempo debe ser un número mayor que 0'
      }
    }

    if (systemParamType === 'Keywords') {
      const keywords = parseKeywords(form.value)

      if (!form.value.trim()) {
        newErrors.value = 'Debe agregar al menos una palabra clave'
      } else if (!isValidJsonArrayString(form.value)) {
        newErrors.value = 'El formato de palabras clave no es válido'
      } else if (keywords.length === 0) {
        newErrors.value = 'Debe agregar al menos una palabra clave'
      } else if (keywords.length > 10) {
        newErrors.value = 'Solo se permiten hasta 10 palabras clave'
      } else if (keywords.some((keyword) => keyword.trim().length > 20)) {
        newErrors.value = 'Cada palabra clave debe tener máximo 20 caracteres'
      } else if (keywords.some((keyword) => !keyword.trim())) {
        newErrors.value = 'No se permiten palabras clave vacías'
      }
    }

    if (systemParamType === 'Conditional') {
      if (form.value !== '' && form.value !== 'true') {
        newErrors.value = 'El valor condicional solo puede ser activo o vacío'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form, systemParamType])

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

  const handleConditionalValueChange = useCallback(
    (checked: boolean) => {
      setField('value', checked ? 'true' : '')
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
        await onSubmit({
          ...form,
          value: form.value ?? '',
        })

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
    handleConditionalValueChange,
    handleSubmit,
  }
}
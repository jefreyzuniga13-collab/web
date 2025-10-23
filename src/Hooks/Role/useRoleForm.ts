import { useState, useEffect, useCallback } from 'react'
import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface'

type Mode = 'create' | 'update' | 'view'

interface Params {
  mode: Mode
  data: RoleResponseDto | null
  onSubmit: (values: { roleName: string; description?: string | null }) => void
}

interface Errors {
  roleName?: string
}

export function useRoleForm({ mode, data, onSubmit }: Params) {
  const isView = mode === 'view'

  const initialForm = {
    roleName: '',
    description: '' as string | null | undefined,
  }

  const [form, setForm] = useState<{ roleName: string; description?: string | null }>(initialForm)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if ((mode === 'update' || isView) && data) {
      setForm({
        roleName: data.roleName,
        description: data.description ?? '',
      })
    } else if (mode === 'create') {
      setForm(initialForm)
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const next: Errors = {}
    if (!form.roleName.trim()) next.roleName = 'El nombre es obligatorio'
    setErrors(next)
    return Object.keys(next).length === 0
  }, [form])

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
    (e) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
      if (errors[name as keyof Errors]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    },
    [errors]
  )

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault()
      if (!validate()) return
      onSubmit({ roleName: form.roleName.trim(), description: form.description?.trim() ?? '' })
    },
    [form, onSubmit, validate]
  )

  return { form, errors, isView, handleChange, handleSubmit }
}
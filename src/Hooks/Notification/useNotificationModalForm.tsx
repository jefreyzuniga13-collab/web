/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react'
import type { NotificationRequestDto, NotificationResponseDto } from '@/Interfaces/Notification/NotificationInterfaces'
import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface'

type Mode = 'create' | 'edit' | 'view'

interface UseNotificationFormArgs {
  mode: Mode
  data?: NotificationResponseDto | NotificationRequestDto | null
  onSubmit: (id: number, values: NotificationRequestDto) => void
  availableRoles: RoleResponseDto[]
}

interface FormErrors {
  name?: string
  description?: string
  type?: string
  payload?: string
  rolesId?: string
}

export function useNotificationModalForm({
  mode,
  data,
  onSubmit,
  availableRoles
}: UseNotificationFormArgs) {
  const isView = mode === 'view'

  const [form, setForm] = useState<NotificationRequestDto>({
    name: '',
    description: '',
    type: 'NewContact',
    payload: '',
    isActive: true,
    rolesId: []
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && data) {
      setForm({
        name: data.name,
        description: data.description,
        type: data.type as any,
        payload: data.payload,
        isActive: data.isActive,
        rolesId: Array.isArray(data.rolesId) ? (data.rolesId as any) : []
      })
    } else {
      setForm({
        name: '',
        description: '',
        type: 'NewContact',
        payload: '',
        isActive: true,
        rolesId: []
      })
      setErrors({})
    }
  }, [mode, data])

//   const validate = useCallback(() => {
//     const errs: FormErrors = {}
//     if (!form.name.trim()) errs.name = 'El nombre es obligatorio'
//     if (!form.description.trim()) errs.description = 'La descripción es obligatoria'
//     if (!form.type) errs.type = 'Debe seleccionar un tipo'
//     if (!form.payload.trim()) errs.payload = 'El payload es obligatorio'
//     if (!form.rolesId || form.rolesId.length === 0) errs.rolesId = 'Debe asignar al menos un rol'
    
//     setErrors(errs)
//     return Object.keys(errs).length === 0

//   }, [form])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setForm(prev => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleSelect = useCallback(
    (field: keyof NotificationRequestDto, value: any) => {
      setForm(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleCheckbox = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target
      setForm(prev => ({ ...prev, [name]: checked }))
    },
    []
  )

  const handleRolesSelection = useCallback((selectedIds: number[]) => {
    setForm(prev => ({ ...prev, rolesId: selectedIds }))
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (isView) return
      //if (validate()) 
      //En el caso que no hay usuario seleccionado se manda 0, pero al crear no se pasa como parametro
        onSubmit(0, form)

        console.log("Datos enviados", JSON.stringify(form))
    },
    [form, isView, onSubmit]
  )

  return {
    form,
    errors,
    isView,
    availableRoles,
    handleChange,
    handleSelect,
    handleCheckbox,
    handleRolesSelection,
    handleSubmit
  }
}
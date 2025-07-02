import { useState, useEffect, useCallback } from 'react'
import type { User } from '@/Interfaces/User/UserInterfaces'

export interface UserFormData {
  fullName: string
  email: string
  password: string
  companyId: number
  phone: string
  identifier: string
  isActive: boolean
  roleIds: number[]
  sendWelcomeEmail: boolean
  imageFile: File | null
}

export interface UseUserFormParams {
  initialData?: User | null
  onSubmit: (payload: FormData) => void
}

export function useUserForm({ initialData, onSubmit }: UseUserFormParams) {
  const [form, setForm] = useState<UserFormData>({
    fullName: '',
    email: '',
    password: '',
    companyId: 0,
    phone: '',
    identifier: '',
    isActive: true,
    roleIds: [],
    sendWelcomeEmail: false,
    imageFile: null,
  })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName,
        email: initialData.email,
        password: '',
        companyId: initialData.companyId,
        phone:      initialData.phone      ?? '',
        identifier: initialData.identifier ?? '',
        isActive: initialData.isActive,
        roleIds: initialData.roles.map(r => r.roleId),
        sendWelcomeEmail: false,
        imageFile: null,
      })
    }
  }, [initialData])

  const validate = useCallback(() => {
    const errs: Record<string,string> = {}
    if (!form.fullName.trim()) errs.fullName = 'El nombre completo es obligatorio'
    if (!form.email.trim()) errs.email = 'El correo electrónico es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Formato de correo no válido'
    if (initialData == null) {
      if (!form.password) errs.password = 'La contraseña es obligatoria'
      else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    } else if (form.password && form.password.length < 6) {
      errs.password = 'Mínimo 6 caracteres'
    }
    if (form.roleIds.length === 0) errs.roleIds = 'Seleccione al menos un rol'
    if (form.imageFile && form.imageFile.size > 5 * 1024 * 1024) {
      errs.imageFile = 'La imagen no puede superar los 5MB'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form, initialData])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type, checked } = e.target as HTMLInputElement
      setForm(f => ({
        ...f,
        [name]:
          type === 'checkbox'
            ? checked
            : name === 'companyId'
            ? Number(value)
            : value,
      }))
      if (errors[name]) setErrors(e => ({ ...e, [name]: '' }))
    },
    [errors]
  )

  const handleRoles = useCallback(
    (selected: (string|number)[]) => {
      const roleIds = selected.map(v => Number(v))
      setForm(f => ({ ...f, roleIds }))
      if (errors.roleIds) setErrors(e => ({ ...e, roleIds: '' }))
    },
    [errors]
  )

  const handleFile = useCallback((file: File | null) => {
    setForm(f => ({ ...f, imageFile: file }))
    if (errors.imageFile) setErrors(e => ({ ...e, imageFile: '' }))
  }, [errors])

  const toggleShowPassword = useCallback(() => {
    setShowPassword(v => !v)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const fd = new FormData()
    fd.append('fullName', form.fullName)
    fd.append('email', form.email)
    if (form.password) fd.append('password', form.password)
    fd.append('companyId', String(form.companyId))
    fd.append('phone', form.phone)
    fd.append('identifier', form.identifier)
    fd.append('isActive', String(form.isActive))
    fd.append('sendWelcomeEmail', String(form.sendWelcomeEmail))
    form.roleIds.forEach(id => fd.append('roleIds', String(id)))
    if (form.imageFile) fd.append('imageFile', form.imageFile)
    onSubmit(fd)
  }, [form, validate, onSubmit])

  return {
    form,
    errors,
    showPassword,
    handleChange,
    handleRoles,
    handleFile,
    toggleShowPassword,
    handleSubmit,
  }
}
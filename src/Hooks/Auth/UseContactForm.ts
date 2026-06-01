/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import type { ContactLogInterface, ContactFormValues } from '@/Interfaces/Auth/ContactInterface'
type Mode = 'create' | 'edit' | 'view'

interface UseContactFormArgs {
  mode: Mode
  data?: ContactLogInterface | null
  onSubmit: (values: ContactFormValues) => void
}

interface FormErrors {
  waName?: string
  fullName?: string
  phone?: string
  idCard?: string
  passport?: string
  residenceCard?: string
  clientId?: string
}

export function useContactForm({ mode, data, onSubmit }: UseContactFormArgs) {
  const isView = mode === 'view'

  const [form, setForm] = useState<ContactFormValues>({
    waName: null,
    waId: null,
    waUserId: null,
    phone: '',
    idType: null,
    idCard: null,
    passport: null,
    residenceCard: null,
    fullName: null,
    companyName: '',
    companyId: null,
    clientId: null,
    status: 'Completed',
    isVerified: true,
    isActive: true,
    verifiedAt: null,
    verifiedBy: null,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && data) {
      setForm({
        waName: data.waName,
        waId: data.waId ?? null,
        waUserId: data.waUserId ?? null,
        phone: data.phone,
        idType: data.idType,
        idCard: data.idCard ?? null,
        passport: data.passport ?? null,
        residenceCard: data.residenceCard ?? null,
        fullName: data.fullName ?? null,
        companyName: data.companyName ?? '',
        companyId: null,
        clientId: data.clientId ?? null,
        status: data.status,
        isVerified: data.isVerified ?? true,
        isActive: data.isActive ?? true,
        verifiedAt: data.verifiedAt ?? null,
        verifiedBy: data.verifiedId ?? null,
      })
    } else {
      setForm({
        waName: null,
        waId: null,
        waUserId: null,
        phone: '',
        idType: null,
        idCard: null,
        passport: null,
        residenceCard: null,
        fullName: null,
        companyName: '',
        companyId: null,
        clientId: null,
        status: 'Completed',
        isVerified: true,
        isActive: true,
        verifiedAt: null,
        verifiedBy: null,
      })
      setErrors({})
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const errs: FormErrors = {}
    if (!form.fullName?.trim()) errs.fullName = 'Nombre completo es obligatorio'
    if (!form.phone.trim()) {
      errs.phone = 'Número de teléfono obligatorio'
    } else if (!/^505\d{8}$/.test(form.phone)) {
      errs.phone = 'Formato inválido (505 + 8 dígitos)'
    }
    
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setForm(f => ({ ...f, [name]: value }))
    },
    []
  )

  const handleSelect = useCallback(
    (field: keyof ContactFormValues, value: any) => {
      setForm(f => {
        const next = { ...f, [field]: value }
        // }
        return next
      })
    },
    []
  )

  const handleCheckbox = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target
      setForm(f => ({ ...f, [name]: checked }))
    },
    []
  )

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (isView) return
      if (validate()) onSubmit(form)
    },
    [form, isView, onSubmit, validate]
  )

  return {
    form,
    errors,
    isView,
    handleChange,
    handleSelect,
    handleCheckbox,
    handleSubmit,
  }
}
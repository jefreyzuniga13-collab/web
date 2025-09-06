/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import type { ContactLogInterface, ContactFormValues } from '@/Interfaces/Contact/ContactInterface'
import { useInnova } from '@/Hooks/useInnova'

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

  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError,
    getAllAsync,
  } = useInnova()

  useEffect(() => {
    getAllAsync()
  }, [])

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
   // if (!form.waName?.trim()) errs.waName = 'Nombre WhatsApp es obligatorio'
    if (!form.fullName?.trim()) errs.fullName = 'Nombre completo es obligatorio'
    if (!form.phone.trim()) {
      errs.phone = 'Número de teléfono obligatorio'
    } else if (!/^505\d{8}$/.test(form.phone)) {
      errs.phone = 'Formato inválido (505 + 8 dígitos)'
    }
    // if (form.idType === 'NationalCard') {
    //   if (!form.idCard?.trim()) {
    //     errs.idCard = 'Cédula es obligatoria'
    //   } else if (!/^(?:\d{3}-\d{6}-\d{4}[A-Z]|\d{13}[A-Z])$/.test(form.idCard)) {
    //     errs.idCard = 'Formato de cédula inválido (XXX-XXXXXX-XXXXL o XXXXXXXXXXXXXL)'
    //   }
    // }
    // if (form.idType === 'Passport') {
    //   if (!form.passport?.trim()) {
    //     errs.passport = 'Pasaporte es obligatorio'
    //   } else if (!/^[A-Z]{1,2}\d{7}$/.test(form.passport)) {
    //     errs.passport = 'Formato de pasaporte inválido (Letra + 7 dígitos)'
    //   }
    // }
    // if (form.idType === 'ResidenceCard') {
    //   if (!form.residenceCard?.trim()) {
    //     errs.residenceCard = 'Residencia es obligatoria'
    //   } else if (!/^(?:[A-Z]{1,2}\d{7}|\d{1,12})$/.test(form.residenceCard)) {
    //     errs.residenceCard = 'Formato de residencia inválido (1 o  2Letra + 7 dígitos o  12 dígitos)'
    //   }
    // }
    if (!form.clientId) errs.clientId = 'Debe seleccionar un cliente'
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
        if (field === 'clientId' && Array.isArray(clients) && clients.length) {
          const v = String(value)
          const selected = clients.find((c: any) => String(c.clientId) === v)
          next.companyName = selected?.clientId ?? ''
        }
        return next
      })
    },
    [clients]
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
    clients,
    clientsLoading,
    clientsError,
    handleChange,
    handleSelect,
    handleCheckbox,
    handleSubmit,
  }
}
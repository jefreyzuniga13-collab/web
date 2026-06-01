import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import type { CompaniesLicenseProj, CompaniesLicenseRequest, FormErrors } from '@/Interfaces/Crm/LicenseInterfaz'
import type { ModalMode } from '@/Interfaces/Common/GlobalInterface'

interface Args {
  mode: ModalMode
  data?: CompaniesLicenseProj | null
  onSubmit: (values: CompaniesLicenseRequest) => void
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  return value.substring(0, 10)
}

export const initialForm: CompaniesLicenseRequest = {
  companyId: 0,
  licencesId: 0,
  validFrom: '',
  validTo: '',
  isActive: true,
  isSuspended: false,
  isLocked: false,
  observation: ''
}

const initialErrors: FormErrors = {
  companyId: '',
  licencesId: '',
  validFrom: '',
  validTo: '',
  observation: ''
}

export function useCompaniesLicenseForm({ mode, data, onSubmit }: Args) {
  const isView = mode === 'view'

  const [form, setForm] = useState<CompaniesLicenseRequest>(initialForm)
  const [errors, setErrors] = useState<FormErrors>(initialErrors)

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && data) {
      setForm({
        companyId: data.companyId ?? 0,
        licencesId: data.licencesId ?? 0,
        validFrom: formatDate(data.validFrom),
        validTo: formatDate(data.validTo),
        isActive: data.isActive ?? true,
        isSuspended: data.isSuspended ?? false,
        isLocked: data.isLocked ?? false,
        observation: data.observation ?? ''
      })
    } else {
      setForm(initialForm)
      setErrors(initialErrors)
    }
  }, [mode, data])

  const validate = useCallback(() => {
    const errs: FormErrors = {
      companyId: '',
      licencesId: '',
      validFrom: '',
      validTo: '',
      observation: ''
    }

    if (!form.companyId || form.companyId <= 0) {
      errs.companyId = 'La empresa es obligatoria'
    }

    if (!form.licencesId || form.licencesId <= 0) {
      errs.licencesId = 'La licencia es obligatoria'
    }

    if (!form.validFrom) {
      errs.validFrom = 'La fecha inicial es obligatoria'
    }

    if (!form.validTo) {
      errs.validTo = 'La fecha final es obligatoria'
    }

    if (form.validFrom && form.validTo && new Date(form.validTo) < new Date(form.validFrom)) {
      errs.validTo = 'La fecha final no puede ser menor que la fecha inicial'
    }

    setErrors(errs)

    return !errs.companyId && !errs.licencesId && !errs.validFrom && !errs.validTo
  }, [form])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setForm(prev => ({
      ...prev,
      [name]: type === 'number' || name === 'companyId' || name === 'licencesId'
        ? Number(value)
        : value
    }))
  }, [])

  const handleCheckbox = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target

    setForm(prev => ({
      ...prev,
      [name]: checked
    }))
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
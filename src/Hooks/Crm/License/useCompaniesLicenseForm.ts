import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import type {
  CompaniesLicenseProj,
  CompaniesLicenseRequest,
  FormErrors
} from '@/Interfaces/Crm/LicenseInterfaz'
import type { ModalMode } from '@/Interfaces/Common/GlobalInterface'

interface Args {
  mode: ModalMode
  data?: CompaniesLicenseProj | null
  onSubmit: (values: CompaniesLicenseRequest) => void
}

const formatDate = (value?: string | null): string => {
  if (!value) return ''
  return value.substring(0, 10)
}

export const initialForm: CompaniesLicenseRequest = {
  companyId: 0,
  licencesId: 0,
  validFrom: '',
  statusId: 0,
  observation: '',
  licenseExpirationWarningDays: 0
}

const initialErrors: FormErrors = {
  companyId: '',
  licencesId: '',
  validFrom: '',
  statusId: '',
  observation: '',
  licenseExpirationWarningDays: 0
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
        statusId: data.statusId ?? 0,
        observation: data.observation ?? '',
        licenseExpirationWarningDays: data.licenseExpirationWarningDays ?? 0
      })

      setErrors(initialErrors)
      return
    }

    setForm(initialForm)
    setErrors(initialErrors)
  }, [mode, data])

  const validate = useCallback(() => {
    const errs: FormErrors = {
      companyId: '',
      licencesId: '',
      validFrom: '',
      statusId: '',
      observation: '',
      licenseExpirationWarningDays: 0
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

    if (!form.statusId || form.statusId <= 0) {
      errs.statusId = 'El estado es obligatorio'
    }

    if (form.observation && form.observation.length > 1000) {
      errs.observation = 'La observación no puede superar los 1000 caracteres'
    }

    if (form.licenseExpirationWarningDays < 0) {
      errs.statusId = 'No puede ser menor a 0'
    }


    setErrors(errs)

    return (
      !errs.companyId &&
      !errs.licencesId &&
      !errs.validFrom &&
      !errs.statusId &&
      !errs.observation
    )
  }, [form])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target

      setForm(prev => ({
        ...prev,
        [name]:
          name === 'companyId' ||
          name === 'licencesId' ||
          name === 'statusId'
            ? Number(value)
            : value
      }))
    },
    []
  )

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()

      if (isView) return

      if (!validate()) return

      onSubmit({
        companyId: form.companyId,
        licencesId: form.licencesId,
        validFrom: form.validFrom,
        statusId: form.statusId,
        observation: form.observation?.trim() ?? '',
        licenseExpirationWarningDays: form.licenseExpirationWarningDays ?? 0
      })
    },
    [form, isView, onSubmit, validate]
  )

  return {
    form,
    errors,
    isView,
    handleChange,
    handleSubmit,
    setForm
  }
}
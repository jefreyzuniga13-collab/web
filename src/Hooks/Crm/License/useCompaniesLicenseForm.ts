import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent
} from 'react'
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

const isValidDateValue = (value: string): boolean => {
  if (!value) return false

  const regex = /^\d{4}-\d{2}-\d{2}$/

  if (!regex.test(value)) return false

  const date = new Date(`${value}T00:00:00`)

  return !Number.isNaN(date.getTime())
}

const toDate = (value: string): Date => {
  return new Date(`${value}T00:00:00`)
}

export const initialForm: CompaniesLicenseRequest = {
  companyId: 0,
  licencesId: 0,
  validFrom: '',
  validTo: '',
  statusId: 0,
  observation: '',
  licenseExpirationWarningDays: 0
}

const initialErrors: FormErrors = {
  companyId: '',
  licencesId: '',
  validFrom: '',
  validTo: '',
  statusId: '',
  observation: '',
  licenseExpirationWarningDays: ''
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
      validTo: '',
      statusId: '',
      observation: '',
      licenseExpirationWarningDays: ''
    }

    if (!form.companyId || form.companyId <= 0) {
      errs.companyId = 'La empresa es obligatoria'
    }

    if (!form.licencesId || form.licencesId <= 0) {
      errs.licencesId = 'La licencia es obligatoria'
    }

    if (!form.validFrom) {
      errs.validFrom = 'La fecha inicial es obligatoria'
    } else if (!isValidDateValue(form.validFrom)) {
      errs.validFrom = 'La fecha inicial no tiene un formato válido'
    }

    if (form.validTo && !isValidDateValue(form.validTo)) {
      errs.validTo = 'La fecha final no tiene un formato válido'
    }

    if (
      form.validFrom &&
      form.validTo &&
      isValidDateValue(form.validFrom) &&
      isValidDateValue(form.validTo)
    ) {
      const validFromDate = toDate(form.validFrom)
      const validToDate = toDate(form.validTo)

      if (validToDate < validFromDate) {
        errs.validTo = 'La fecha final no puede ser menor que la fecha inicial'
      }
    }

    if (!form.statusId || form.statusId <= 0) {
      errs.statusId = 'El estado es obligatorio'
    }

    if (form.observation && form.observation.length > 1000) {
      errs.observation = 'La observación no puede superar los 1000 caracteres'
    }

    const warningDays = Number(form.licenseExpirationWarningDays)

    if (
      form.licenseExpirationWarningDays === null ||
      form.licenseExpirationWarningDays === undefined ||
      Number.isNaN(warningDays)
    ) {
      errs.licenseExpirationWarningDays = 'Los días de alerta son obligatorios'
    } else if (warningDays < 0) {
      errs.licenseExpirationWarningDays = 'No puede ser menor a 0'
    }

    setErrors(errs)

    return (
      !errs.companyId &&
      !errs.licencesId &&
      !errs.validFrom &&
      !errs.validTo &&
      !errs.statusId &&
      !errs.observation &&
      !errs.licenseExpirationWarningDays
    )
  }, [form])

  const handleChange = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target

      setForm(prev => ({
        ...prev,
        [name]:
          name === 'companyId' ||
          name === 'licencesId' ||
          name === 'statusId' ||
          name === 'licenseExpirationWarningDays'
            ? Number(value)
            : value
      }))

      setErrors(prev => ({
        ...prev,
        [name]: ''
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
        companyId: Number(form.companyId),
        licencesId: Number(form.licencesId),
        validFrom: form.validFrom,
        validTo: form.validTo || undefined,
        statusId: Number(form.statusId),
        observation: form.observation?.trim() ?? '',
        licenseExpirationWarningDays: Number(
          form.licenseExpirationWarningDays ?? 0
        )
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
    setForm,
    setErrors
  }
}
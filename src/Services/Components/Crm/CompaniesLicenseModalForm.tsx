import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import Input from '@/Services/Components/Common/Input'
import { Label } from '@/Services/Components/Common/Label'
import Button from '@/Services/Components/Common/Button'
import { useCompany } from '@/Hooks/Crm/useCompany'
import { LicensesService } from '@/Services/Crm/LicensesService'
import { StatusService } from '@/Services/Crm/StatusService'
import { useCompaniesLicenseForm } from '@/Hooks/Crm/License/useCompaniesLicenseForm'
import type {
  CompaniesLicenseProj,
  CompaniesLicenseRequest,
  LicenseProj
} from '@/Interfaces/Crm/LicenseInterfaz'
import type { StatusResponseDto } from '@/Interfaces/Crm/StatusInterface'
import type { ModalMode } from '@/Interfaces/Common/GlobalInterface'
import '@/Styles/Auth/ContactModal.css'

interface Props {
  mode: ModalMode
  isOpen: boolean
  data?: CompaniesLicenseProj | null
  onClose: () => void
  onSubmit: (values: CompaniesLicenseRequest) => void
  loading: boolean
}

const addMonths = (dateValue: string, months: number): string => {
  if (!dateValue || months <= 0) return ''

  const date = new Date(`${dateValue}T00:00:00`)
  date.setMonth(date.getMonth() + months)

  return date.toISOString().substring(0, 10)
}

const addDays = (dateValue: string, days: number): string => {
  if (!dateValue || days <= 0) return ''

  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + days)

  return date.toISOString().substring(0, 10)
}

const normalizeText = (value?: string | null): string => {
  return value?.trim().toLowerCase() ?? ''
}

export default function CompaniesLicenseModalForm({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
  loading
}: Props) {
  const [freeLicenseDays, setFreeLicenseDays] = useState<number>(0)

  const {
    form,
    errors,
    isView,
    handleChange,
    handleSubmit,
    setForm
  } = useCompaniesLicenseForm({ mode, data, onSubmit })

  const { companies = [], loading: loadingCompanies } = useCompany()

  const {
    data: licenses = [],
    isLoading: loadingLicenses
  } = useQuery<LicenseProj[], Error>({
    queryKey: ['licenses-select'],
    queryFn: async () => {
      const res = await LicensesService.getAllAsync('', 1, 1000)
      return res?.items ?? []
    },
    staleTime: 1000 * 60 * 5
  })

  const {
    data: statuses = [],
    isLoading: loadingStatuses
  } = useQuery<StatusResponseDto[], Error>({
    queryKey: ['company-license-statuses-select'],
    queryFn: async () => {
      return await StatusService.getCompanyLicenseStatusesAsync()
    },
    staleTime: 1000 * 60 * 10
  })

  const selectedLicense = useMemo(
    () => licenses.find(license => license.id === form.licencesId),
    [licenses, form.licencesId]
  )

  const isFreeLicense = useMemo(() => {
    const code = normalizeText(selectedLicense?.licensePeriodCode)
    const name = normalizeText(selectedLicense?.licensePeriodName)

    return code === 'libre' || name === 'libre'
  }, [selectedLicense])

  const calculatedValidTo = useMemo(() => {
    if (!form.validFrom) return ''

    const months =
      selectedLicense?.duration ??
      selectedLicense?.licensePeriodMonths ??
      0

    return addMonths(form.validFrom, months)
  }, [selectedLicense, form.validFrom])

  const validToValue = useMemo(() => {
    if (isFreeLicense) {
      return form.validTo ?? ''
    }

    if (mode === 'edit' || mode === 'view') {
      return form.validTo ?? ''
    }

    return calculatedValidTo
  }, [isFreeLicense, mode, form.validTo, calculatedValidTo])

  const licenseDescription = useMemo(() => {
    if (!selectedLicense) return ''

    if (isFreeLicense) {
      return 'Licencia libre - rango manual o duración en días'
    }

    if (!selectedLicense.isRecurrent) {
      return 'Licencia no recurrente'
    }

    const periodName = selectedLicense.licensePeriodName || 'Periodo'
    const months =
      selectedLicense.licensePeriodMonths ||
      selectedLicense.duration ||
      0

    return `${periodName} - ${months} mes(es)`
  }, [selectedLicense, isFreeLicense])

  const handleFreeLicenseDaysChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const days = Number(e.target.value)

    setFreeLicenseDays(days)

    if (!isFreeLicense) return

    if (!form.validFrom || days <= 0) {
      return
    }

    setForm(prev => ({
      ...prev,
      validTo: addDays(prev.validFrom, days)
    }))
  }

  const handleValidToChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setFreeLicenseDays(0)
    handleChange(e)
  }

  useEffect(() => {
    if (!selectedLicense) return

    if (!isFreeLicense) {
      setFreeLicenseDays(0)
    }
  }, [selectedLicense, isFreeLicense])

  useEffect(() => {
    if (!selectedLicense) return
    if (mode === 'edit' || mode === 'view') return
    if (isFreeLicense) return

    setForm(prev => ({
      ...prev,
      validTo: calculatedValidTo
    }))
  }, [
    selectedLicense,
    mode,
    isFreeLicense,
    calculatedValidTo,
    setForm
  ])

  useEffect(() => {
    if (!isFreeLicense) return
    if (mode === 'view') return
    if (!form.validFrom) return
    if (freeLicenseDays <= 0) return

    setForm(prev => ({
      ...prev,
      validTo: addDays(prev.validFrom, freeLicenseDays)
    }))
  }, [
    isFreeLicense,
    mode,
    form.validFrom,
    freeLicenseDays,
    setForm
  ])

  useEffect(() => {
    if (!isOpen) {
      setFreeLicenseDays(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="cm-modal__overlay">
      <div className="cm-modal__container">
        <header className="cm-modal__header">
          <h2 className="cm-modal__title">
            {mode === 'create' && 'Asignar Licencia'}
            {mode === 'edit' && 'Editar Licencia de Empresa'}
            {mode === 'view' && 'Detalle Licencia de Empresa'}
          </h2>

          <button type="button" className="cm-modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="cm-modal__body" onSubmit={handleSubmit}>
          <div className="cm-modal__grid">
            <div className="cm-modal__col">
              <Label htmlFor="companyId">Empresa *</Label>

              <select
                id="companyId"
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                disabled={isView || loadingCompanies}
                className="cm-modal__select"
              >
                <option value={0}>Seleccione una empresa</option>

                {companies?.map(company => {
                  const companyId = company.companyId ?? 0

                  if (companyId <= 0) return null

                  return (
                    <option key={companyId} value={companyId}>
                      {company.name}
                    </option>
                  )
                })}
              </select>

              {errors.companyId && (
                <div className="cm-modal__error">{errors.companyId}</div>
              )}
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="licencesId">Licencia *</Label>

              <select
                id="licencesId"
                name="licencesId"
                value={form.licencesId}
                onChange={handleChange}
                disabled={isView || loadingLicenses}
                className="cm-modal__select"
              >
                <option value={0}>Seleccione una licencia</option>

                {licenses?.map(license => (
                  <option key={license.id} value={license.id}>
                    {license.name} - {license.licensePeriodName}
                  </option>
                ))}
              </select>

              {errors.licencesId && (
                <div className="cm-modal__error">{errors.licencesId}</div>
              )}

              {licenseDescription && (
                <small className="cm-modal__hint">
                  {licenseDescription}
                </small>
              )}
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="validFrom">Válida desde *</Label>

              <Input
                id="validFrom"
                name="validFrom"
                type="date"
                value={form.validFrom}
                onChange={handleChange}
                disabled={isView}
              />

              {errors.validFrom && (
                <div className="cm-modal__error">{errors.validFrom}</div>
              )}
            </div>

            {isFreeLicense && !isView && (
              <div className="cm-modal__col">
                <Label htmlFor="freeLicenseDays">
                  Duración libre en días
                </Label>

                <Input
                  id="freeLicenseDays"
                  name="freeLicenseDays"
                  type="number"
                  min={0}
                  value={freeLicenseDays}
                  onChange={handleFreeLicenseDaysChange}
                  disabled={isView || !form.validFrom}
                />

                <small className="cm-modal__hint">
                  Si ingresas días, la fecha final se calculará automáticamente.
                </small>
              </div>
            )}

            <div className="cm-modal__col">
              <Label htmlFor="validTo">
                Válida hasta {isFreeLicense ? '*' : ''}
              </Label>

              <Input
                id="validTo"
                name="validTo"
                type="date"
                value={validToValue}
                onChange={handleValidToChange}
                disabled={isView || !isFreeLicense}
              />

              {errors.validTo && (
                <div className="cm-modal__error">{errors.validTo}</div>
              )}

              <small className="cm-modal__hint">
                {isFreeLicense
                  ? 'Puedes seleccionar una fecha final manualmente o calcularla con duración en días.'
                  : 'La fecha final se calcula automáticamente según la licencia.'}
              </small>
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="statusId">Estado *</Label>

              <select
                id="statusId"
                name="statusId"
                value={form.statusId}
                onChange={handleChange}
                disabled={isView || loadingStatuses}
                className="cm-modal__select"
              >
                <option value={0}>Seleccione un estado</option>

                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>

              {errors.statusId && (
                <div className="cm-modal__error">{errors.statusId}</div>
              )}
            </div>

            {(mode === 'view' || mode === 'edit') && (
              <div className="cm-modal__col">
                <Label htmlFor="remainingDays">Días restantes</Label>

                <Input
                  id="remainingDays"
                  name="remainingDays"
                  value={data?.remainingDays?.toString() ?? ''}
                  disabled
                />
              </div>
            )}

            <div className="cm-modal__col">
              <Label htmlFor="licenseExpirationWarningDays">
                Días antes para mostrar alerta *
              </Label>

              <Input
                id="licenseExpirationWarningDays"
                name="licenseExpirationWarningDays"
                type="number"
                min={0}
                value={form.licenseExpirationWarningDays}
                onChange={handleChange}
                disabled={isView}
              />

              {errors.licenseExpirationWarningDays && (
                <div className="cm-modal__error">
                  {errors.licenseExpirationWarningDays}
                </div>
              )}

              <small className="cm-modal__hint">
                Indica cuántos días antes del vencimiento se mostrará la alerta.
              </small>
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="observation">Observación</Label>

              <textarea
                id="observation"
                name="observation"
                value={form.observation}
                onChange={handleChange}
                disabled={isView}
                className="cm-modal__textarea"
                maxLength={1000}
              />

              {errors.observation && (
                <div className="cm-modal__error">{errors.observation}</div>
              )}

              {!isView && (
                <small className="cm-modal__hint">
                  {form.observation.length}/1000 caracteres
                </small>
              )}
            </div>
          </div>

          <footer className="cm-modal__footer">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="cm-modal__footer__btn"
            >
              Cancelar
            </Button>

            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="cm-modal__footer__btn"
                disabled={loading}
              >
                {loading ? (
                  <AiOutlineLoading3Quarters
                    fontSize={16}
                    className="animate-spin"
                  />
                ) : mode === 'create' ? (
                  'Asignar'
                ) : (
                  'Guardar'
                )}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
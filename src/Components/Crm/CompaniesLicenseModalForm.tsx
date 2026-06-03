import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import { useCompany } from '@/Hooks/Crm/useCompany'
import { LicensesService } from '@/Services/Crm/LicensesService'
import { StatusService } from '@/Services/Crm/StatusService'
import { useCompaniesLicenseForm } from '@/Hooks/Crm/License/useCompaniesLicenseForm'
import type {CompaniesLicenseProj, CompaniesLicenseRequest, LicenseProj} from '@/Interfaces/Crm/LicenseInterfaz'
import type { StatusResponseDto } from '@/Interfaces/Crm/StatusInterface'
import type { ModalMode } from '@/Interfaces/Common/GlobalInterface'
import '@/Styles/Auth/ContactModal.css'
import { formatDate } from '@/Utils/formatters'

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

export default function CompaniesLicenseModalForm({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
  loading
}: Props) {
  const {
    form,
    errors,
    isView,
    handleChange,
    handleSubmit
  } = useCompaniesLicenseForm({ mode, data, onSubmit })

  const { companies = [], loading: loadingCompanies } = useCompany()

  const { data: licenses = [], isLoading: loadingLicenses } = useQuery<LicenseProj[], Error>({
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

  const estimatedValidTo = useMemo(() => {
    if (mode === 'view' || mode === 'edit') {
      return formatDate(data?.validTo)
    }

    const months = selectedLicense?.duration ?? selectedLicense?.licensePeriodMonths ?? 0
    return addMonths(form.validFrom, months)
  }, [mode, data?.validTo, selectedLicense, form.validFrom])

  const licenseDescription = useMemo(() => {
    if (!selectedLicense) return ''

    if (!selectedLicense.isRecurrent) {
      return 'Licencia no recurrente'
    }

    const periodName = selectedLicense.licensePeriodName || 'Periodo'
    const months = selectedLicense.licensePeriodMonths || selectedLicense.duration || 0

    return `${periodName} - ${months} mes(es)`
  }, [selectedLicense])

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
            <div className="cm-modal__col">
              <Label htmlFor="estimatedValidTo">Válida hasta</Label>
              <Input
                id="estimatedValidTo"
                name="estimatedValidTo"
                type="date"
                value={estimatedValidTo}
                 onChange={(e) => {
                  if (selectedLicense?.licensePeriodCode !== 'Libre') {
                    handleChange(e);
                  }
                }}
                disabled={selectedLicense?.licensePeriodCode !== 'Libre'}
              />

              <small className="cm-modal__hint">
                La fecha final se calcula automáticamente según la licencia.
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
                <Label htmlFor="licenseExpirationWarningDays">Días Mostrar Alertas</Label>
                <Input
                  id="licenseExpirationWarningDays"
                  name="licenseExpirationWarningDays"
                  type='number'
                  value={data?.licenseExpirationWarningDays}
                  disabled={isView ? true : false}
                />

                {errors.licenseExpirationWarningDays && (
                <div className="cm-modal__error">{errors.licenseExpirationWarningDays}</div>
              )}
              </div>

            <div className="cm-modal__col cm-modal__col">
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
                  <AiOutlineLoading3Quarters fontSize={16} className="animate-spin" />
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
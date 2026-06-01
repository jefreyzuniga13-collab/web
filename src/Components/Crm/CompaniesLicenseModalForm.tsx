import { useQuery } from '@tanstack/react-query'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import { useCompany } from '@/Hooks/Crm/useCompany'
import { LicensesService } from '@/Services/Crm/LicensesService'
import { useCompaniesLicenseForm } from '@/Hooks/Crm/License/useCompaniesLicenseForm'
import type { CompaniesLicenseProj, CompaniesLicenseRequest, LicenseProj } from '@/Interfaces/Crm/LicenseInterfaz'
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
    handleCheckbox,
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
                {companies?.map(company => (
                  <option key={company.companyId} value={company.companyId ?? 1}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.companyId && <div className="cm-modal__error">{errors.companyId}</div>}
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
                    {license.name}
                  </option>
                ))}
              </select>
              {errors.licencesId && <div className="cm-modal__error">{errors.licencesId}</div>}
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
              {errors.validFrom && <div className="cm-modal__error">{errors.validFrom}</div>}
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="validTo">Válida hasta *</Label>
              <Input
                id="validTo"
                name="validTo"
                type="date"
                value={form.validTo}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.validTo && <div className="cm-modal__error">{errors.validTo}</div>}
            </div>

            <div className="cm-modal__col cm-modal__col--full">
              <Label htmlFor="observation">Observación</Label>
              <textarea
                id="observation"
                name="observation"
                value={form.observation}
                onChange={handleChange}
                disabled={isView}
                className="cm-modal__textarea"
              />
              {errors.observation && <div className="cm-modal__error">{errors.observation}</div>}
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="isActive">Activa</Label>
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={form.isActive}
                onChange={handleCheckbox}
                disabled={isView}
              />
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="isSuspended">Suspendida</Label>
              <input
                type="checkbox"
                id="isSuspended"
                name="isSuspended"
                checked={form.isSuspended}
                onChange={handleCheckbox}
                disabled={isView}
              />
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="isLocked">Bloqueada</Label>
              <input
                type="checkbox"
                id="isLocked"
                name="isLocked"
                checked={form.isLocked}
                onChange={handleCheckbox}
                disabled={isView}
              />
            </div>
          </div>

          <footer className="cm-modal__footer">
            <Button variant="secondary" onClick={onClose} className="cm-modal__footer__btn">
              Cancelar
            </Button>

            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="cm-modal__footer__btn"
                disabled={loading}
              >
                {loading ? <AiOutlineLoading3Quarters /> : mode === 'create' ? 'Asignar' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
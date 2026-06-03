import { useState, type KeyboardEvent, type ChangeEvent } from 'react'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import { useLicenseForm } from '@/Hooks/Crm/License/useLicenseForm'
import type { LicensePeriodProj, LicenseProj, LicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import '@/Styles/Crm/LicenseModal.css'

interface Props {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: LicenseProj | null
  licensePeriods: LicensePeriodProj[]
  onClose: () => void
  onSubmit: (values: LicenseRequest) => void
  loading: boolean
}

export default function LicenseModalForm({
  mode,
  isOpen,
  data,
  licensePeriods,
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
    handleSubmit,
    setForm
  } = useLicenseForm({ mode, data, onSubmit })

  const [newBenefit, setNewBenefit] = useState('')

  if (!isOpen) return null

  const getBenefitsArray = (): string[] => {
    if (!form.benefits) return []
    if (Array.isArray(form.benefits)) return form.benefits

    try {
      const parsed = JSON.parse(form.benefits)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const licensePeriodId = Number(e.target.value)
    const selectedPeriod = licensePeriods.find(period => period.id === licensePeriodId)

    setForm(prev => ({
      ...prev,
      licensePeriodId,
      duration: selectedPeriod?.months ?? 1
    }))
  }

  const handleAddBenefit = (): void => {
    const trimmedBenefit = newBenefit.trim()
    if (!trimmedBenefit) return

    const currentBenefits = getBenefitsArray()

    if (!currentBenefits.includes(trimmedBenefit)) {
      setForm((prev: LicenseRequest) => ({
        ...prev,
        benefits: [...currentBenefits, trimmedBenefit]
      }))
    }

    setNewBenefit('')
  }

  const handleRemoveBenefit = (indexToRemove: number): void => {
    const updatedBenefits = getBenefitsArray().filter((_, index) => index !== indexToRemove)

    setForm((prev: LicenseRequest) => ({
      ...prev,
      benefits: updatedBenefits
    }))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddBenefit()
    }
  }

  return (
    <div className="cm-modal__overlay">
      <div className="cm-modal__container">
        <header className="cm-modal__header">
          <h2 className="cm-modal__title">
            {mode === 'create' && 'Nueva Licencia'}
            {mode === 'edit' && 'Editar Licencia'}
            {mode === 'view' && 'Detalle Licencia'}
          </h2>

          <button type="button" className="cm-modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="cm-modal__body" onSubmit={handleSubmit}>
          <div className="cm-modal__grid">
            <div className="cm-modal__col">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.name && <div className="cm-modal__error">{errors.name}</div>}
            </div>

            <div className="cm-modal__col">
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.description && <div className="cm-modal__error">{errors.description}</div>}
            </div>

            <div className="cm-modal__col cm-modal__col--checkbox">
              <input
                type="checkbox"
                id="isRecurrent"
                name="isRecurrent"
                checked={form.isRecurrent || false}
                onChange={handleCheckbox}
                disabled={isView}
              />
              <Label htmlFor="isRecurrent" className="label-checkbox">
                Renovable / Recurrente
              </Label>
            </div>

            {form.isRecurrent && (
              <div className="cm-modal__col">
                <Label htmlFor="licensePeriodId">Periodo *</Label>
                <select
                  id="licensePeriodId"
                  name="licensePeriodId"
                  value={form.licensePeriodId || 0}
                  onChange={handlePeriodChange}
                  disabled={isView}
                  className="cm-modal__select"
                >
                  <option value={0}>Seleccione un periodo</option>
                  {licensePeriods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.name} - {period.months} mes(es)
                    </option>
                  ))}
                </select>

                {errors.licensePeriodId && (
                  <div className="cm-modal__error">{errors.licensePeriodId}</div>
                )}
              </div>
            )}

            <div className="cm-modal__col">
              <Label htmlFor="newBenefit">Beneficios</Label>

              {!isView && (
                <div className="cm-modal__benefit-input-group">
                  <Input
                    id="newBenefit"
                    name="newBenefit"
                    placeholder="Ej. Soporte 24/7"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddBenefit}
                  >
                    Agregar
                  </Button>
                </div>
              )}

              <div className="cm-modal__chips-container">
                {getBenefitsArray().map((benefit, index) => (
                  <span key={`${benefit}-${index}`} className="cm-modal__chip">
                    {benefit}

                    {!isView && (
                      <button
                        type="button"
                        className="cm-modal__chip-remove"
                        onClick={() => handleRemoveBenefit(index)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="cm-modal__col cm-modal__col--checkbox">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={form.isActive || false}
                onChange={handleCheckbox}
                disabled={isView}
              />
              <Label htmlFor="isActive" className="label-checkbox">
                Activo
              </Label>
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
                  'Crear'
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
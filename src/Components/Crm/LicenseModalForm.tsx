import { useState, type KeyboardEvent, type ChangeEvent } from 'react'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import { useLicenseForm } from '@/Hooks/Crm/License/useLicenseForm'
import type { LicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import '@/Styles/Crm/LicenseModal.css'

interface Props {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: LicenseRequest | null
  onClose: () => void
  onSubmit: (values: LicenseRequest) => void
  loading: boolean
}

export default function ContactModalForm({ mode, isOpen, data, onClose, onSubmit, loading }: Props) {
  // Nota: Asegúrate de que tu hook useLicenseForm exponga "setForm" con el tipo correcto:
  // Dispatch<SetStateAction<LicenseRequest>>
  const { form, 
    errors, 
    isView, 
    handleChange, 
    handleCheckbox, 
    handleSubmit,
    setForm 
  } = useLicenseForm({ mode, data, onSubmit })

  // Estado local para el texto del beneficio que se está escribiendo
  const [newBenefit, setNewBenefit] = useState<string>('')

  if (!isOpen) return null

  // Obtener de forma segura los beneficios asegurando que es un array de strings
  const getBenefitsArray = (): string[] => {
    if (!form.benefits) return []
    if (Array.isArray(form.benefits)) return form.benefits
    
    try {
      // Por si acaso el backend o el estado inicial lo maneja como un JSON string
      const parsed = JSON.parse(form.benefits)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Agregar un beneficio al array
  const handleAddBenefit = (): void => {
    const trimmedBenefit = newBenefit.trim()
    if (!trimmedBenefit) return

    const currentBenefits = getBenefitsArray()

    if (!currentBenefits.includes(trimmedBenefit)) {
      const updatedBenefits = [...currentBenefits, trimmedBenefit]
      
      if (setForm) {
        setForm((prev: LicenseRequest) => ({ ...prev, benefits: updatedBenefits }))
      } else {
        // En caso de que uses estrictamente el handleChange del hook simulando el evento
        const syntheticEvent = {
          target: { name: 'benefits', value: updatedBenefits }
        } as unknown as ChangeEvent<HTMLInputElement>
        handleChange(syntheticEvent)
      }
    }
    setNewBenefit('') // Limpiar el input
  }

  // Eliminar un beneficio del array por su índice
  const handleRemoveBenefit = (indexToRemove: number): void => {
    const updatedBenefits = getBenefitsArray().filter((_, index) => index !== indexToRemove)

    if (setForm) {
      setForm((prev: LicenseRequest) => ({ ...prev, benefits: updatedBenefits }))
    } else {
      const syntheticEvent = {
        target: { name: 'benefits', value: updatedBenefits }
      } as unknown as ChangeEvent<HTMLInputElement>
      handleChange(syntheticEvent)
    }
  }

  // Manejar el "Enter" en el input de beneficios
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault() // Evita que el formulario se envíe de golpe
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
              <Label htmlFor="isRecurrent" className="label-checkbox">Renovable / Recurrente</Label>
            </div>

            {form.isRecurrent && (
              <div className="cm-modal__col">
                <Label htmlFor="duration">Duración</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={form.duration || ''}
                  onChange={handleChange}
                  disabled={isView}
                />
              </div>
            )}

            <div className="cm-modal__col cm-modal__col">
              <Label htmlFor="newBenefit">Beneficios (Enter para guardar)</Label>
              
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
              <Label htmlFor="isActive" className="label-checkbox">Activo</Label>
            </div>
          </div>
          <footer className="cm-modal__footer">
            <Button variant="secondary" onClick={onClose} className="cm-modal__footer__btn">
              Cancelar
            </Button>
            {!isView && (
              <Button variant="primary" type="submit" className="cm-modal__footer__btn" disabled={loading}>
                {loading ? <AiOutlineLoading3Quarters fontSize={16} className="animate-spin" /> :
                  mode === 'create' ? 'Crear' : 'Guardar'
                }
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
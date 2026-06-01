import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import { useLicenseForm } from '@/Hooks/Crm/License/useLicenseForm'
import '@/Styles/Auth/ContactModal.css'
import type {LicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

interface Props {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: LicenseRequest | null
  onClose: () => void
  onSubmit: (values: LicenseRequest) => void
  loading: boolean
}

export default function ContactModalForm({ mode, isOpen, data, onClose, onSubmit,loading }: Props) {
  const { form, 
    errors, 
    isView, 
    handleChange, 
    handleCheckbox, 
    handleSubmit } =
    useLicenseForm({ mode, data, onSubmit })

  if (!isOpen) return null

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
              <Label htmlFor="fullName">Nombre *</Label>
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
              <Label htmlFor="phone">Descripción *</Label>
              <Input
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.description && <div className="cm-modal__error">{errors.description}</div>}
            </div>
            
            <div className="cm-modal__col">
              <Label htmlFor="isActive">Activo</Label>
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={form.isActive}
                onChange={handleCheckbox}
                disabled={isView}
              />
            </div>
          </div>

          <footer className="cm-modal__footer">
            <Button variant="secondary" onClick={onClose} className='cm-modal__footer__btn'>
              Cancelar
            </Button>
            {!isView && (
              <Button variant="primary" type="submit" className='cm-modal__footer__btn' disabled={loading}>
                {loading ? <AiOutlineLoading3Quarters />:
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
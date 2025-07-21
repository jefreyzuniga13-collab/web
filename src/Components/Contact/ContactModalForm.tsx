import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import { useContactForm } from '@/Hooks/Contact/UseContactForm'
import '@/Styles/Contact/ContactModal.css'
import type { ContactFormValues, ContactLogInterface } from '@/Interfaces/Contact/ContactInterface'

interface ContactModalProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: ContactLogInterface | null
  onClose: () => void
  onSubmit: (values: ContactFormValues) => void
}

const idTypeOptions = [
  { value: '', label: 'Seleccione Tipo de ID' },
  { value: 'NationalCard', label: 'Cédula Nacional' },
  { value: 'Passport', label: 'Pasaporte' },
  { value: 'ResidenceCard', label: 'Cédula Residencia' },
]

const statusOptions = [
  { value: 'PendingApproval', label: 'Pendiente Aprobación' },
  { value: 'Approved', label: 'Aprobado' },
  { value: 'Rejected', label: 'Rechazado' },
  { value: 'AwaitingFullName', label: 'Esperando Nombre' },
  { value: 'AwaitingIdCard', label: 'Esperando Cédula' },
  { value: 'Completed', label: 'Completado' },
]

export default function ContactModalForm({ mode, isOpen, data, onClose, onSubmit }: ContactModalProps) {
  const { form, errors, isView, companies, handleChange, handleSelect, handleCheckbox, handleSubmit } =
    useContactForm({ mode, data, onSubmit })

  if (!isOpen) return null

  return (
    <div className="cm-modal__overlay">
      <div className="cm-modal__container">
        <header className="cm-modal__header">
          <h2 className="cm-modal__title">
            {mode === 'create' && 'Nuevo Contacto'}
            {mode === 'edit' && 'Editar Contacto'}
            {mode === 'view' && 'Detalle Contacto'}
          </h2>
          <button type="button" className="cm-modal__close" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="cm-modal__body" onSubmit={handleSubmit}>
          <div className="cm-modal__grid">
            <div className="cm-modal__col">
              <Label htmlFor="waName">Nombre WhatsApp</Label>
              <Input
                id="waName"
                name="waName"
                value={form.waName || ''}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.waName && <div className="cm-modal__error">{errors.waName}</div>}
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="waId">ID WhatsApp</Label>
              <Input
                id="waId"
                name="waId"
                value={form.waId || ''}
                onChange={handleChange}
                disabled={isView}
              />
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.phone && <div className="cm-modal__error">{errors.phone}</div>}
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="idType">Tipo ID</Label>
              <Select
                id="idType"
                value={form.idType ?? ''}
                onChange={e => handleSelect('idType', e.target.value)}
                disabled={isView}
                options={idTypeOptions}
              />
            </div>
            {form.idType === 'NationalCard' && (
              <div className="cm-modal__col">
                <Label htmlFor="idCard">Cédula Nacional</Label>
                <Input
                  id="idCard"
                  name="idCard"
                  value={form.idCard || ''}
                  onChange={handleChange}
                  disabled={isView}
                />
                {errors.idCard && <div className="cm-modal__error">{errors.idCard}</div>}
              </div>
            )}
            {form.idType === 'Passport' && (
              <div className="cm-modal__col">
                <Label htmlFor="passport">Pasaporte</Label>
                <Input
                  id="passport"
                  name="passport"
                  value={form.passport || ''}
                  onChange={handleChange}
                  disabled={isView}
                />
                {errors.passport && <div className="cm-modal__error">{errors.passport}</div>}
              </div>
            )}
            {form.idType === 'ResidenceCard' && (
              <div className="cm-modal__col">
                <Label htmlFor="residenceCard">Cédula Residencia</Label>
                <Input
                  id="residenceCard"
                  name="residenceCard"
                  value={form.residenceCard || ''}
                  onChange={handleChange}
                  disabled={isView}
                />
                {errors.residenceCard && <div className="cm-modal__error">{errors.residenceCard}</div>}
              </div>
            )}
            <div className="cm-modal__col">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                name="fullName"
                value={form.fullName || ''}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.fullName && <div className="cm-modal__error">{errors.fullName}</div>}
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="companyId">Empresa</Label>
              <Select
                id="companyId"
                value={form.companyId ?? ''}
                onChange={e => {
                  const id = Number(e.target.value)
                  handleSelect('companyId', id)
                  const selected = companies?.find(c => c.companyId === id)
                  if (selected) handleSelect('companyName', selected.name)
                }}
                disabled={isView}
                options={companies?.map(c => ({ value: String(c.companyId), label: c.name })) || []}
              />
              {errors.companyId && <div className="cm-modal__error">{errors.companyId}</div>}
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="companyName">Nombre Empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                value={form.companyName ?? ''}
                disabled
              />
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="status">Estado</Label>
              <Select
                id="status"
                value={form.status}
                onChange={e => handleSelect('status', e.target.value)}
                disabled={isView}
                options={statusOptions}
              />
            </div>
            <div className="cm-modal__col">
              <Label htmlFor="isVerified">Verificado</Label>
              <input
                type="checkbox"
                id="isVerified"
                name="isVerified"
                checked={form.isVerified}
                onChange={handleCheckbox}
                disabled={isView}
              />
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
              <Button variant="primary" type="submit" className='cm-modal__footer__btn'>
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
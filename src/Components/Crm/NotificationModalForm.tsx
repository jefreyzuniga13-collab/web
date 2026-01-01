import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import { Label } from '@/Components/Common/Label'
import Button from '@/Components/Common/Button'
import '@/Styles/Crm/NotificationModal.css'
import { useNotificationModalForm } from '@/Hooks/Crm/useNotificationModalForm'
import type { NotificationRequestDto, NotificationResponseDto } from '@/Interfaces/Crm/NotificationInterfaces'
import { useRoles } from '@/Hooks/Auth/useRole'

interface NotificationModalProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: NotificationResponseDto | NotificationRequestDto | null
  onClose: () => void
  onSubmit: (values: NotificationRequestDto) => void
}

const notificationTypeOptions = [
  { value: 'NewContact', label: 'Nuevo Contacto' },
  { value: 'SupportRequested', label: 'Soporte Solicitado' },
  { value: 'ConversationAssigned', label: 'Conversación Asignada' },
  { value: 'ConversationClosed', label: 'Conversación Cerrada' }
]

export default function NotificationModalForm({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: NotificationModalProps) {
const {roles} = useRoles();

  const {
    form,
    errors,
    isView,
    availableRoles,
    handleChange,
    handleSelect,
    handleCheckbox,
    handleRolesSelection,
    handleSubmit
  } = useNotificationModalForm({
    mode,
    data,
    onSubmit,
    availableRoles: roles
  })

  if (!isOpen) return null

  return (
    <div className="nm-modal__overlay">
      <div className="nm-modal__container">
        <header className="nm-modal__header">
          <h2 className="nm-modal__title">
            {mode === 'create' && 'Nueva Notificación'}
            {mode === 'edit' && 'Editar Notificación'}
            {mode === 'view' && 'Detalle Notificación'}
          </h2>
          <button type="button" className="nm-modal__close" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="nm-modal__body" onSubmit={handleSubmit}>
          <div className="nm-modal__grid">
            <div className="nm-modal__col">
              <Label htmlFor="name">Título</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.name && <div className="nm-modal__error">{errors.name}</div>}
            </div>
            <div className="nm-modal__col">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.description && <div className="nm-modal__error">{errors.description}</div>}
            </div>
            <div className="nm-modal__col">
              <Label htmlFor="type">Tipo de Notificación</Label>
              <Select
                id="type"
                value={form.type}
                onChange={e => handleSelect('type', e.target.value)}
                disabled={isView}
                options={notificationTypeOptions}
              />
              {errors.type && <div className="nm-modal__error">{errors.type}</div>}
            </div>
            <div className="nm-modal__col">
              <Label htmlFor="payload">Payload</Label>
              <textarea
                id="payload"
                name="payload"
                value={form.payload}
                onChange={handleChange}
                disabled={isView}
                className="nm-modal__textarea"
              />
              {errors.payload && <div className="nm-modal__error">{errors.payload}</div>}
            </div>
            <div className="nm-modal__col nm-modal__col--checkbox">
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
            <div className="nm-modal__col nm-modal__col--roles">
              <Label>Roles asociados</Label>
              <div className="nm-modal__roles-list">
                {availableRoles.map(role => (
                  <label key={role.roleId} className="nm-modal__role-item">
                    <input
                      type="checkbox"
                      checked={form.rolesId.includes(role.roleId)}
                      disabled={isView}
                      onChange={e => {
                        const selected = e.target.checked
                          ? [...form.rolesId, role.roleId]
                          : form.rolesId.filter(id => id !== role.roleId)
                        handleRolesSelection(selected)
                      }}
                    />
                    {role.roleName}
                  </label>
                ))}
              </div>
              {errors.rolesId && <div className="nm-modal__error">{errors.rolesId}</div>}
            </div>
          </div>
          <footer className="nm-modal__footer">
            <Button variant="secondary" onClick={onClose} className="nm-modal__footer__btn">
              Cancelar
            </Button>
            {!isView && (
              <Button variant="primary" type="submit" className="nm-modal__footer__btn">
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}

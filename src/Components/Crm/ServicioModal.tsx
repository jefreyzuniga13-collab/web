import Button from '@/Components/Common/Button'
import { useServiceForm } from '@/Hooks/Crm/useServiceForm'
import type { ServiceResponseDto, ServiceRequestDto } from '@/Interfaces/Crm/ServiceInterface'
import '@/Styles/Setting/WorkShiftModal.css'
import {TextField} from '@mui/material'
import { Label } from '@/Components/Common/Label'
import Input from '@/Components/Common/Input'


interface Props {
  mode: 'create' | 'update' | 'view'
  isOpen: boolean
  data?: ServiceResponseDto | null
  onClose: () => void
  onSubmit: (values: ServiceRequestDto) => void
}

export default function ServiceModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: Props) {
  const {
    form,
    errors,
    isView,
    handleChange,
    handleCheckbox,
    handleSubmit,
  } = useServiceForm({ mode, data, onSubmit })

    if (!isOpen) return null

  return (
    <div className="ws-modal__overlay">
      <div className="ws-modal__container">
        <header className="ws-modal__header">
          <h2 className="ws-modal__title">
            {mode === 'create' ? 'Asignar Turno' : mode === 'update' ? 'Editar Asignación de Turno' : 'Detalle Asignación de Turno'}
          </h2>
          <button type="button" className="ws-modal__close" onClick={onClose}>×</button>
        </header>
        <form className="ws-modal__body" onSubmit={handleSubmit}>
          <div className="ws-modal__grid">

            <div className="ws-modal__col">
              <Label htmlFor="fullName">Nombre servicio*</Label>
              <Input
                id="name"
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.name && <div className="cm-modal__error">{errors.name}</div>}
            </div>

             <div className="ws-modal__col">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.descripcion && <div className="cm-modal__error">{errors.descripcion}</div>}
            </div>
            <div className="ws-modal__col">

             <label className="ws-modal__field--checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleCheckbox}
                  disabled={isView}
                /> Activo
              </label>
            </div>

            {/* Timestamps (View Mode) */}
            {isView && data && (
              <div className="ws-modal__col ws-modal__col--full ws-modal__timestamps">
                <TextField
                  value={new Date(data.createdAt).toLocaleString()}
                  label="Creado"
                  disabled
                  fullWidth
                />
                {data.updatedAt && (
                  <TextField
                    value={new Date(data.updatedAt).toLocaleString()}
                    label="Actualizado"
                    disabled
                    fullWidth
                  />
                )}
                 {data.createdByName && (
                  <TextField
                    value={new Date(data.createdByName).toLocaleString()}
                    label="Creado por"
                    disabled
                    fullWidth
                  />
                )}
                 {data.updatedByName && (
                  <TextField
                    value={new Date(data.updatedByName).toLocaleString()}
                    label="Actualizado por"
                    disabled
                    fullWidth
                  />
                )}
              </div>
            )}
          </div>

          <footer className="ws-modal__footer">
            <Button
              variant="secondary"
              onClick={onClose}
              className="ws-modal__btn ws-modal__btn--cancel"
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="ws-modal__btn ws-modal__btn--confirm"
              >
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
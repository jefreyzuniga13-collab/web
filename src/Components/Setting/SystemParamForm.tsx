import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import {Textarea} from '@/Components/Common/Textarea'
import Select from '@/Components/Common/Select'
import { useSystemParamForm } from '@/Hooks/Setting/useSystemParamForm'
import type {
  SystemParamRequestDto,
  SystemParamResponseDto,
} from '@/Interfaces/Auth/AuthInterface'
import '@/Styles/Setting/SystemParamForm.css'
import type { NameTranslation } from '@/Interfaces/Setting/OpeningHour'

interface SystemParamModalProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: SystemParamResponseDto | null
  onClose: () => void
  onSubmit: (values: SystemParamRequestDto) => void
}

const typeOptions = [
  { value: 'Prompts', label: 'Mensaje' },
  { value: 'Keywords', label: 'Palabra Clave' },
  { value: 'Temp', label: 'Tiempo' },
]

const nameTranslations: Record<NameTranslation, string> = {
  WelcomeBot: "Bienvenida ChatBot",
  AskFullName: "Pregunta Nombre",
  AskIdCard: "Pregunta Cédula",
  InvalidIdFormat: "Cédula Invalida",
  DataComplete: "Datos Completos",
  InactivityWarning: "Advertencia Inactividad",
  InactivityClosed: "Inactividad Cerrada",
  SupportRequestReceived: "Solicitud Soporte Recibida",
  WaitWarningCloseTime: "Advertencia Cierre Espera",
  InactivityWarningThresholdMesssage: "Mensaje Umbral Inactividad",
  WaitWarningCloseMesssage: "Mensaje Advertencia Cierre",
  BotGreetings: "Saludo Bot",
  AskCompanyName: "Pregunta Nombre Empresa",
  InvalidPasswordFormat: "Formato Contraseña Invalido",
  InvalidResidenceCardFormat: "Formato Cédula Residencia Invalido",
  RequestIdType: "Solicitud Tipo Identificación",
  ContactComplete: "Contacto Completo",
  OutOfBotContext: "Fuera Contexto Bot",
  RequestUnderReviewMessage: "Mensaje Solicitud En Revisión",
  RequestUnderReviewTime: "Tiempo Solicitud En Revisión",
  UnclosedConversationMessage: "Mensaje Conversación No Cerrada",
  UnclosedConversationTime: "Tiempo Conversación No Cerrada",
};

export default function SystemParamModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: SystemParamModalProps) {
  const { form, errors, isView, handleChange, handleSelect, handleSubmit } =
    useSystemParamForm({ mode, data: data || null, onSubmit })

  if (!isOpen) return null

  return (
    <div className="sp-modal__overlay">
      <div className="sp-modal__container">
        <header className="sp-modal__header">
          <h2 className="sp-modal__title">
            {mode === 'create' && 'Crear Parámetro'}
            {mode === 'edit' && 'Editar Parámetro'}
            {mode === 'view' && 'Detalle Parámetro'}
          </h2>
          <button type="button" className="sp-modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="sp-modal__body" onSubmit={handleSubmit}>
          <div className="sp-modal__grid">
            
            <div className="sp-modal__col">
              <Label htmlFor="name" className="sp-modal__label">
                Nombre *
              </Label>
              <Input
                id="name"
                name="name"
                value={nameTranslations[form.name as NameTranslation] as string}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.name && <div className="sp-modal__error">{errors.name}</div>}
            </div>

            <div className="sp-modal__col">
              <Label htmlFor="type" className="sp-modal__label">
                Tipo *
              </Label>
              <Select
                value={form.type}
                // onValueChange={handleSelect}
                onChange={e => handleSelect(e.target.value)}
                options={typeOptions}
                disabled={isView}
                className="sp-modal__select"
              />
              {errors.type && <div className="sp-modal__error">{errors.type}</div>}
            </div>

            <div className="sp-modal__col sp-modal__col--full">
              <Label htmlFor="value" className="sp-modal__label">
                Valor *
              </Label>
              <Textarea
                id="value"
                name="value"
                value={form.value}
                onChange={handleChange}
                rows={3}
                disabled={isView}
                className='sp-modal__input'
              />
              {errors.value && <div className="sp-modal__error">{errors.value}</div>}
            </div>

            <div className="sp-modal__col sp-modal__col--full">
              <Label htmlFor="description" className="sp-modal__label">
                Descripción *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                disabled={isView}
                className='sp-modal__input'
              />
              {errors.description && (
                <div className="sp-modal__error">{errors.description}</div>
              )}
            </div>
          </div>

          <footer className="sp-modal__footer">
            <Button
              variant="secondary"
              onClick={onClose}
              className="sp-modal__btn sp-modal__btn--cancel"
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="sp-modal__btn sp-modal__btn--confirm"
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
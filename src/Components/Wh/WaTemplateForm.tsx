import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import { Textarea } from '@/Components/Common/Textarea'
import '@/Styles/Crm/SystemParamForm.css'
import '@/Styles/Wa/WaTemplate.css'

import type { WaTemplateRequestDto, WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import { useWaTemplateForm, type FormMode } from '@/Hooks/Wh/useWaTemplateForm'

interface Props {
  mode: FormMode
  isOpen: boolean
  data?: WaTemplateResponseDto | null
  onClose: () => void
  onSubmit: (values: WaTemplateRequestDto) => void
}

export default function WaTemplateForm({
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
    categories,
    loadingCategories,
    setDisplayName,
    setCategory,
    setHeaderText,
    setBodyText,
    setFooterText,
    submit,
  } = useWaTemplateForm({ mode, data: data || null, onSubmit })

  if (!isOpen) return null

  const previewHeader = form.header.text.trim()
  const previewBody = form.body.text.trim() || 'Escribe el cuerpo de la plantilla para ver la vista previa.'
  const previewFooter = form.footer.text.trim()
  const previewTime = new Date().toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="sp-modal__overlay">
      <div className="sp-modal__container_expanded wa-template-modal">
        <header className="sp-modal__header">
          <div>
            <h2 className="sp-modal__title">
              {mode === 'create' ? 'Crear plantilla' : 'Detalle de plantilla'}
            </h2>
            <p className="wa-template-modal__subtitle">
              Encabezado, cuerpo y pie. Sin variables ni botones.
            </p>
          </div>
          <button type="button" className="sp-modal__close" onClick={onClose}>×</button>
        </header>

        <form
          className="sp-modal__body wa-template-layout"
          onSubmit={(e) => { e.preventDefault(); if (!isView) submit(); }}
        >
          <section className="wa-template-layout__form">
            <h3 className="wa-template-section__title">Datos</h3>

            <div className="wa-template-field">
              <Label className="sp-modal__label">Nombre *</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isView}
                placeholder="Ej. Aviso de pedido"
              />
              {form.externalName && (
                <small className="wa-template-field__hint">
                  Nombre interno: {form.externalName}
                </small>
              )}
              {errors.displayName && <div className="sp-modal__error">{errors.displayName}</div>}
            </div>

            <div className="wa-template-field">
              <Label className="sp-modal__label">Categoría *</Label>
              <Select
                value={form.categoryId ?? ''}
                onChange={(e) => setCategory(e.target.value)}
                options={categories}
                disabled={isView || loadingCategories}
                className="sp-modal__select"
              />
              {errors.categoryId && <div className="sp-modal__error">{errors.categoryId}</div>}
            </div>

            <h3 className="wa-template-section__title">Mensaje</h3>

            <div className="wa-template-field">
              <Label className="sp-modal__label">Encabezado</Label>
              <Input
                value={form.header.text}
                onChange={(e) => setHeaderText(e.target.value)}
                disabled={isView}
                placeholder="Título corto, opcional"
                maxLength={60}
              />
              {errors.headerText && <div className="sp-modal__error">{errors.headerText}</div>}
            </div>

            <div className="wa-template-field">
              <Label className="sp-modal__label">Cuerpo *</Label>
              <Textarea
                value={form.body.text}
                onChange={(e) => setBodyText(e.target.value)}
                rows={8}
                disabled={isView}
                placeholder="Escribe el mensaje que verá el cliente."
              />
              {errors.bodyText && <div className="sp-modal__error">{errors.bodyText}</div>}
            </div>

            <div className="wa-template-field">
              <Label className="sp-modal__label">Pie</Label>
              <Input
                value={form.footer.text}
                onChange={(e) => setFooterText(e.target.value)}
                disabled={isView}
                placeholder="Texto corto al final, opcional"
                maxLength={60}
              />
              {errors.footerText && <div className="sp-modal__error">{errors.footerText}</div>}
            </div>
          </section>

          <aside className="wa-template-layout__preview">
            <h3 className="wa-template-section__title">Vista previa</h3>
            <p className="wa-template-preview__hint">Así verá el cliente el mensaje en WhatsApp.</p>
            <div className="wa-template-phone">
              <div className="wa-template-phone__bar">
                <span className="wa-template-phone__logo">W</span>
                <span>
                  <strong>WhatsApp Business</strong>
                  <small>en línea</small>
                </span>
              </div>
              <div className="wa-template-phone__chat">
                <div className="wa-template-phone__bubble">
                  {previewHeader && <strong>{previewHeader}</strong>}
                  <p>{previewBody}</p>
                  {previewFooter && <small>{previewFooter}</small>}
                  <time>{previewTime}</time>
                </div>
              </div>
            </div>
          </aside>

          <footer className="sp-modal__footer wa-template-layout__footer">
            <Button variant="secondary" onClick={onClose} className="sp-modal__btn sp-modal__btn--cancel">
              Cancelar
            </Button>
            {!isView && (
              <Button variant="primary" type="submit" className="sp-modal__btn sp-modal__btn--confirm">
                Crear
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}

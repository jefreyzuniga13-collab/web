/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import { Textarea } from '@/Components/Common/Textarea'
import '@/Styles/Setting/SystemParamForm.css'

import type { WaTemplateRequestDto, WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import { useWaTemplateForm, type FormMode } from '@/Hooks/Wh/useWaTemplateForm'

interface Props {
  mode: FormMode
  isOpen: boolean
  data?: WaTemplateResponseDto | null
  onClose: () => void
  onSubmit: (values: WaTemplateRequestDto) => void
}

//Para cumplir con la provacion de plantilla con variables de meta es necesario es que se manden ejemplo, como se indica por ellos mismo actualmente no se hace y la rechazan.
//Asi que sea mas amigable, que le usuario ocn un boton pueda agregar variable en el body y poner un texto de ejemplo, y que cuando le de agregar en el boton de insert en el body.
//Actualizado, compelto y sin comnetarios
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
    setHeaderMediaFiles,

    setBodyText,

    setFooterText,

    submit,
  } = useWaTemplateForm({ mode, data: data || null, onSubmit })

  if (!isOpen) return null

  return (
    <div className="sp-modal__overlay">
      <div className="sp-modal__container_expanded">
        <header className="sp-modal__header">
          <h2 className="sp-modal__title">
            {mode === 'create' ? 'Crear Plantilla' : 'Detalle Plantilla'}
          </h2>
          <button type="button" className="sp-modal__close" onClick={onClose}>×</button>
        </header>

        <form
          className="sp-modal__body"
          onSubmit={(e) => { e.preventDefault(); if (!isView) submit(); }}
        >
          <div className="sp-modal__grid">

            {/* NOMBRE AMIGABLE + SNAKE_CASE */}
            <div className="sp-modal__col">
              <Label className="sp-modal__label">Nombre para mostrar *</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isView}
              />
              {errors.displayName && <div className="sp-modal__error">{errors.displayName}</div>}
            </div>

            <div className="sp-modal__col">
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

            {/* HEADER */}
            <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">


                {form.header.enabled && (
                  <>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        
                    </div>

                    {/* TEXT */}
                    {form.header.format === 'TEXT' && (
                      <div style={{ marginTop: 8 }}>
                        <Label className="sp-modal__label">Texto del encabezado *</Label>
                        <Input
                          value={'text' in form.header ? form.header.text : ''}
                          onChange={(e) => setHeaderText(e.target.value)}
                          disabled={isView}
                        />
                        {'text' in form.header && !form.header.text?.trim() && errors.headerText && (
                          <div className="sp-modal__error">{errors.headerText}</div>
                        )}
                      </div>
                    )}

                    {/* MEDIA */}
                    {form.header.format !== 'TEXT' && (
                      <div style={{ marginTop: 8 }}>
                        <Label className="sp-modal__label">Adjuntar archivos (se usarán como example.header_handle)</Label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setHeaderMediaFiles(Array.from(e.target.files || []))}
                          disabled={isView}
                        />
                        {/* Si quieres mostrar nombres seleccionados */}
                        {form.mediaFiles.length > 0 && (
                          <div className="sp-modal__hint" style={{ marginTop: 4 }}>
                            {form.mediaFiles.length} archivo(s) seleccionado(s)
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>


            

            {/* FOOTER */}
            <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">


                {form.footer.enabled && (
                  <div style={{ marginTop: 8 }}>
                    <Label className="sp-modal__label">Texto del pie</Label>
                    <Input
                      value={form.footer.text}
                      onChange={(e) => setFooterText(e.target.value)}
                      disabled={isView}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">

                {form.body.enabled && (
                  <div style={{ marginTop: 8 }}>
                    <Label className="sp-modal__label">Texto del  cuerpo *</Label>
                    <Textarea
                      value={form.body.text}
                      onChange={(e) => setBodyText(e.target.value)}
                      rows={6}
                      disabled={isView}
                    />
                    {errors.bodyText && <div className="sp-modal__error">{errors.bodyText}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="sp-modal__footer">
            <Button variant="secondary" onClick={onClose} className="sp-modal__btn sp-modal__btn--cancel">Cancelar</Button>
            {!isView && (
              <Button variant="primary" type="submit" className="sp-modal__btn sp-modal__btn--confirm">Crear</Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
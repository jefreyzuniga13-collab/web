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
    // setLanguage,
    setCategory,
    // setIsActive,

    // setHeaderEnabled,
    // setHeaderFormat,
    setHeaderText,
    setHeaderMediaFiles,

    // setBodyEnabled,
    setBodyText,

    // setFooterEnabled,
    setFooterText,

    // setButtonsEnabled,
    // addButton,
    // updateButton,
    // removeButton,

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

            {/* <div className="sp-modal__col">
              <Label className="sp-modal__label">Nombre interno (auto) *</Label>
              <Input value={form.externalName} disabled />
              {errors.externalName && <div className="sp-modal__error">{errors.externalName}</div>}
            </div> */}

            {/* IDIOMA + CATEGORÍA */}
            {/* <div className="sp-modal__col">
              <Label className="sp-modal__label">Idioma *</Label>
              <Input
                value={form.language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isView}
              />
              {errors.language && <div className="sp-modal__error">{errors.language}</div>}
            </div> */}

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

            {/* ACTIVA */}
            {/* <div className="sp-modal__col">
              <Label className="sp-modal__label">Activa</Label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isView}
              />
            </div> */}

            {/* HEADER */}
            <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">
                {/* <div className="sp-modal__section-header">
                  <h3>Encabezado (HEADER)</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.header.enabled}
                      onChange={(e) => setHeaderEnabled(e.target.checked)}
                      disabled={isView}
                    />
                    Habilitar
                  </label>
                </div> */}

                {form.header.enabled && (
                  <>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {/* <Button type="button" variant={form.header.format === 'TEXT' ? 'primary' : 'secondary'} onClick={() => setHeaderFormat('TEXT')} disabled={isView}>TEXT</Button> */}
                      {/* <Button type="button" variant={form.header.format === 'IMAGE' ? 'primary' : 'secondary'} onClick={() => setHeaderFormat('IMAGE')} disabled={isView}>IMAGE</Button>
                      <Button type="button" variant={form.header.format === 'VIDEO' ? 'primary' : 'secondary'} onClick={() => setHeaderFormat('VIDEO')} disabled={isView}>VIDEO</Button>
                      <Button type="button" variant={form.header.format === 'DOCUMENT' ? 'primary' : 'secondary'} onClick={() => setHeaderFormat('DOCUMENT')} disabled={isView}>DOCUMENT</Button> */}
                    </div>

                    {/* TEXT */}
                    {form.header.format === 'TEXT' && (
                      <div style={{ marginTop: 8 }}>
                        <Label className="sp-modal__label">Texto del encabezado</Label>
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

            {/* BODY */}
            

            {/* FOOTER */}
            <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">
                {/* <div className="sp-modal__section-header">
                  <h3>Pie (FOOTER)</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.footer.enabled}
                      onChange={(e) => setFooterEnabled(e.target.checked)}
                      disabled={isView}
                    />
                    Habilitar
                  </label>
                </div> */}

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
                {/* <div className="sp-modal__section-header">
                  <h3>Cuerpo (BODY)</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.body.enabled}
                      onChange={(e) => setBodyEnabled(e.target.checked)}
                      disabled={isView}
                    />
                    Habilitar
                  </label>
                </div> */}

                {form.body.enabled && (
                  <div style={{ marginTop: 8 }}>
                    <Label className="sp-modal__label">Texto del  cuerpo</Label>
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

            {/* BUTTONS */}
            {/* <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">
                <div className="sp-modal__section-header">
                  <h3>Botones (BUTTONS)</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.buttons.enabled}
                      onChange={(e) => setButtonsEnabled(e.target.checked)}
                      disabled={isView}
                    />
                    Habilitar
                  </label>
                </div>

                {form.buttons.enabled && (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <Button type="button" variant="secondary" onClick={() => addButton('QUICK_REPLY')} disabled={isView}>+ Quick Reply</Button>
                      <Button type="button" variant="secondary" onClick={() => addButton('URL')} disabled={isView}>+ URL</Button>
                      <Button type="button" variant="secondary" onClick={() => addButton('PHONE_NUMBER')} disabled={isView}>+ Phone</Button>
                    </div>

                    <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                      {form.buttons.rows.map((b, i) => (
                        <div key={i} className="sp-modal__buttonRow">
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="sp-modal__badge">{b.type}</span>

                     
                            <div style={{ minWidth: 220 }}>
                              <Label className="sp-modal__label">Texto</Label>
                              <Input
                                value={(b as any).text ?? ''}
                                onChange={(e) => updateButton(i, 'text', e.target.value)}
                                disabled={isView}
                              />
                            </div>

                      
                            {'url' in b && (
                              <div style={{ minWidth: 260 }}>
                                <Label className="sp-modal__label">URL</Label>
                                <Input
                                  value={(b as any).url ?? ''}
                                  onChange={(e) => updateButton(i, 'url', e.target.value)}
                                  disabled={isView}
                                />
                              </div>
                            )}

                          
                            {'phone_number' in b && (
                              <div style={{ minWidth: 200 }}>
                                <Label className="sp-modal__label">Teléfono</Label>
                                <Input
                                  value={(b as any).phone_number ?? ''}
                                  onChange={(e) => updateButton(i, 'phone_number', e.target.value)}
                                  disabled={isView}
                                />
                              </div>
                            )}

                            {!isView && (
                              <Button type="button" variant="destructive" onClick={() => removeButton(i)}>
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {form.buttons.rows.length === 0 && (
                        <div className="sp-modal__hint">Agrega botones con los atajos de arriba.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div> */}

            
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
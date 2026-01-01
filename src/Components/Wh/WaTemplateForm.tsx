import { useRef, useState } from 'react'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import { Textarea } from '@/Components/Common/Textarea'
import '@/Styles/Crm/SystemParamForm.css'

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

    // Header (solo texto + variables)
    setHeaderText,
    insertHeaderVar,
    removeHeaderVar,
    getHeaderParts,

    // Body (solo texto + variables)
    setBodyText,
    insertBodyVar,
    removeBodyVar,
    getBodyParts,

    // Footer
    setFooterText,

    submit,
  } = useWaTemplateForm({ mode, data: data || null, onSubmit })

  const headerInputRef = useRef<HTMLInputElement | null>(null)
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [headerCaret, setHeaderCaret] = useState<number>(0)
  const [bodyCaret, setBodyCaret] = useState<number>(0)

  const [headerExample, setHeaderExample] = useState<string>('Factura #0011223')
  const [bodyExample, setBodyExample] = useState<string>('Jose Miguel Carcache')

  if (!isOpen) return null

  const handleHeaderSelect = () => {
    const el = headerInputRef.current
    if (!el) return
    setHeaderCaret(el.selectionStart ?? 0)
  }
  const handleBodySelect = () => {
    const el = bodyTextareaRef.current
    if (!el) return
    setBodyCaret(el.selectionStart ?? 0)
  }

  const handleAddHeaderVar = () => {
    if (isView) return
    insertHeaderVar(headerExample || 'VAR', headerCaret)
    const el = headerInputRef.current
    if (el) {
      const newPos = (headerCaret ?? 0) + (headerExample?.length || 0)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(newPos, newPos)
        setHeaderCaret(newPos)
      })
    }
  }

  const handleAddBodyVar = () => {
    if (isView) return
    insertBodyVar(bodyExample || 'VAR', bodyCaret)
    const el = bodyTextareaRef.current
    if (el) {
      const newPos = (bodyCaret ?? 0) + (bodyExample?.length || 0)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(newPos, newPos)
        setBodyCaret(newPos)
      })
    }
  }

  const headerParts = getHeaderParts()
  const bodyParts = getBodyParts()

  // Estilos simples para variables en verde y chips
  const varStyle: React.CSSProperties = { color: '#1f8b24', fontWeight: 600 }
  const previewBox: React.CSSProperties = {
    marginTop: 6,
    padding: '8px 10px',
    background: '#f7f9fb',
    border: '1px dashed #d7e0ea',
    borderRadius: 6,
    fontSize: 14,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.35,
  }
  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 8px',
    background: '#eaf7ec',
    border: '1px solid #b9e2bf',
    borderRadius: 14,
    fontSize: 12,
    marginRight: 8,
    marginBottom: 6,
    color: '#176a1d',
  }
  const chipBtn: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: '#0f5c16',
    cursor: 'pointer',
    fontWeight: 700,
  }

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
                      {/* Controles de variables para HEADER */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 260 }}>
                          <Label className="sp-modal__label">Texto de ejemplo (variable)</Label>
                          <Input
                            value={headerExample}
                            onChange={(e) => setHeaderExample(e.target.value)}
                            disabled={isView}
                            placeholder="Ej: #0001234"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddHeaderVar}
                          disabled={isView}
                        >
                          Agregar variable al encabezado
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <Label className="sp-modal__label">Texto del encabezado *</Label>
                      <Input
                        ref={headerInputRef}
                        value={form.header.text}
                        onChange={(e) => setHeaderText(e.target.value)}
                        onClick={handleHeaderSelect}
                        onKeyUp={handleHeaderSelect}
                        onSelect={handleHeaderSelect}
                        disabled={isView}
                      />
                      {!form.header.text?.trim() && errors.headerText && (
                        <div className="sp-modal__error">{errors.headerText}</div>
                      )}

                      {/* Vista previa con variables en verde */}
                      <div style={previewBox}>
                        {headerParts.map((p, idx) =>
                          p.isVar ? (
                            <span key={idx} style={varStyle}>{p.text}</span>
                          ) : (
                            <span key={idx}>{p.text}</span>
                          )
                        )}
                      </div>

                      {/* Chips de variables actuales (para quitar) */}
                      <div style={{ marginTop: 6 }}>
                        {headerParts.filter(p => p.isVar).map((p, idx) => (
                          <span key={`${p.id}-${idx}`} style={chip}>
                            {p.text}
                            {!isView && (
                              <button
                                type="button"
                                style={chipBtn}
                                title="Quitar variable"
                                onClick={() => p.id && removeHeaderVar(p.id)}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

                            {/* BODY */}
            <div className="sp-modal__col sp-modal__col--full">
              <div className="sp-modal__section">
                {form.body.enabled && (
                  <>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                      {/* Controles de variables para BODY */}
                      <div style={{ minWidth: 260 }}>
                        <Label className="sp-modal__label">Texto de ejemplo (variable)</Label>
                        <Input
                          value={bodyExample}
                          onChange={(e) => setBodyExample(e.target.value)}
                          disabled={isView}
                          placeholder="Ej: Juan David Carcache Suarez"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddBodyVar}
                        disabled={isView}
                      >
                        Agregar variable al cuerpo
                      </Button>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <Label className="sp-modal__label">Texto del cuerpo *</Label>
                      <Textarea
                        ref={bodyTextareaRef}
                        value={form.body.text}
                        onChange={(e) => setBodyText(e.target.value)}
                        onClick={handleBodySelect}
                        onKeyUp={handleBodySelect}
                        onSelect={handleBodySelect}
                        rows={6}
                        disabled={isView}
                      />
                      {errors.bodyText && <div className="sp-modal__error">{errors.bodyText}</div>}

                      {/* Vista previa con variables en verde */}
                      <div style={previewBox}>
                        {bodyParts.map((p, idx) =>
                          p.isVar ? (
                            <span key={idx} style={varStyle}>{p.text}</span>
                          ) : (
                            <span key={idx}>{p.text}</span>
                          )
                        )}
                      </div>

                      {/* Chips para quitar variables */}
                      <div style={{ marginTop: 6 }}>
                        {bodyParts.filter(p => p.isVar).map((p, idx) => (
                          <span key={`${p.id}-${idx}`} style={chip}>
                            {p.text}
                            {!isView && (
                              <button
                                type="button"
                                style={chipBtn}
                                title="Quitar variable"
                                onClick={() => p.id && removeBodyVar(p.id)}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
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
              {!form.header.text?.trim() && errors.headerText && (
                <div className="sp-modal__error">{errors.footerText}</div>
              )}
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
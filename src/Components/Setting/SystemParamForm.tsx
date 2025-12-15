import React, { useEffect, useMemo, useState } from 'react'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import { Textarea } from '@/Components/Common/Textarea'
import Select from '@/Components/Common/Select'
import { useSystemParamForm } from '@/Hooks/Setting/useSystemParamForm'
import type {
  SystemParamRequestDto,
  SystemParamResponseDto,
} from '@/Interfaces/Auth/AuthInterface'
import '@/Styles/Setting/SystemParamForm.css'
import type { NameTranslation } from '@/Interfaces/Setting/OpeningHour'
import { nameTranslations } from '@/Utils/Translation/nameTranslations'
import { toast } from 'react-toastify'

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
  { value: 'Conditional', label: 'Condicional' },
]

export default function SystemParamModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: SystemParamModalProps) {
  const { form, errors, isView, handleChange, 
    inputRef, handleSelect,
     handleCheckbox, handleSubmit,
     loading
    } =
    useSystemParamForm({ mode, data: data || null, onSubmit })

  const parseKeywords = (raw?: string): string[] => {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

  const [keywordInput, setKeywordInput] = useState('')
  const keywords = useMemo(() => (form.type === 'Keywords' ? parseKeywords(form.value) : []), [form.type, form.value])

  const updateFormValue = (val: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleChange({ target: { name: 'value', value: val } } as any)
  }

  const addKeyword = () => {
    if (isView) return
    const k = keywordInput.trim()
    if (!k) return

    if(keywordInput.length > 24 && data?.name !== "OpcionesRapidas"){
      toast.warn("Cada palabra clave no debe exceder los 20 caracteres.")
      return
    }
    if (keywords.length >= 10) {
    toast.warn("Solo puedes agregar hasta 10 palabras clave.")
    
    return
    
  }
    const set = new Set(keywords.map((s) => s.trim()))
    set.add(k)
    const next = Array.from(set)
    updateFormValue(JSON.stringify(next))
    setKeywordInput('')

    inputRef.current?.focus()
  }

  const removeKeyword = (idx: number) => {
    if (isView) return
    const next = keywords.filter((_, i) => i !== idx)
    updateFormValue(JSON.stringify(next))
  }

  const handleKeywordKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  // Si el tipo cambia a "Keywords" y el valor no es JSON válido, normalízalo.
  useEffect(() => {
    if (form.type === 'Keywords') {
      const normalized = JSON.stringify(parseKeywords(form.value))
      if (normalized !== form.value) updateFormValue(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type])

  if (!isOpen) return null

  const isKeywords = form.type === 'Keywords'
  const isConditional = form.type === 'Conditional'

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
              <Label htmlFor="name" className="sp-modal__label ">
                Nombre *
              </Label>
              <Input
                id="name"
                className='sp-modal__input-name'
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
                onChange={(e) => handleSelect(e.target.value)}
                options={typeOptions}
                disabled={isView}
                className="sp-modal__select"
              />
              {errors.type && <div className="sp-modal__error">{errors.type}</div>}
            </div>

            {isConditional ? (
              <div className="sp-modal__col sp-modal__col--full">
                <Label htmlFor="isActive" className="sp-modal__label">
                  Activa
                </Label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  name="isActive"
                  id="isActive"
                  onChange={handleCheckbox}
                  disabled={isView}
                />
              </div>
            ) : (
              <>
                {isKeywords ? (
                  <div className="sp-modal__col sp-modal__col--full">
                    <Label className="sp-modal__label">Palabras Clave</Label>

                    <div className="sp-kws__row">
                      <Input
                        ref={inputRef}
                        className="sp-kws__input"
                        type="text"
                        placeholder="Escribe una palabra"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        disabled={isView}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="sp-kws__addbtn"
                        onClick={addKeyword}
                        disabled={isView || !keywordInput.trim()}
                      >
                        Agregar
                      </Button>
                    </div>

                    <div className="sp-kws__chips">
                      {keywords.map((k, i) => (
                        <span key={`${k}-${i}`} className="sp-chip">
                          <span className="sp-chip__text">{k}</span>
                          {!isView && (
                            <button
                              type="button"
                              className="sp-chip__remove"
                              onClick={() => removeKeyword(i)}
                              aria-label={`Quitar ${k}`}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {keywords.length === 0 && (
                        <span className="sp-kws__empty">Aún no has agregado palabras clave.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  // ----- Valor normal para otros tipos -----
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
                      className="sp-modal__input"
                    />
                    {form.type === 'Conditional' && (
                      <p className="sp_helpText">Los valores permitidos son Si/No</p>
                    )}
                    {errors.value && <div className="sp-modal__error">{errors.value}</div>}
                  </div>
                )}
              </>
            )}

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
                className="sp-modal__input"
              />
              {errors.description && <div className="sp-modal__error">{errors.description}</div>}
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
              <Button variant="primary" type="submit" className="sp-modal__btn sp-modal__btn--confirm">
                {loading ? "Cargando..." : mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}
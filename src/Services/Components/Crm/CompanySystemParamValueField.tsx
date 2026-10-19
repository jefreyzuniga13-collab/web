import { useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEventHandler } from 'react'
import { TextField } from '@mui/material'
import Button from '@/Services/Components/Common/Button'
import Input from '@/Services/Components/Common/Input'
import { Label } from '@/Services/Components/Common/Label'
import { Textarea } from '@/Services/Components/Common/Textarea'
import type { SystemParamType } from '@/Interfaces/Crm/CompanySystemParams'

interface CompanySystemParamValueFieldProps {
  value: string
  type?: SystemParamType | string
  disabled?: boolean
  error?: string
  systemParamName?: string
  onChange: (value: string) => void
  onConditionalChange?: (checked: boolean) => void
}

const parseKeywords = (raw: string): string[] => {
  if (!raw?.trim()) return []

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((item) => typeof item === 'string')
  } catch {
    return []
  }
}

const stringifyKeywords = (keywords: string[]) => {
  return JSON.stringify(keywords)
}

export default function CompanySystemParamValueField({
  value,
  type,
  disabled = false,
  error,
  systemParamName,
  onChange,
  onConditionalChange,
}: CompanySystemParamValueFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaId = useId()

  const [keywordInput, setKeywordInput] = useState('')
  const [variableIndex, setVariableIndex] = useState('0')

  const keywords = useMemo(() => {
    if (type !== 'Keywords') return []
    return parseKeywords(value)
  }, [type, value])

  const isConditionalChecked = value === 'true'

  const addKeyword = () => {
    if (disabled) return

    const keyword = keywordInput.trim()

    if (!keyword) return
    if (keyword.length > 20) return
    if (keywords.length >= 10) return

    const exists = keywords.some(
      (item) => item.trim().toLowerCase() === keyword.toLowerCase()
    )

    if (exists) {
      setKeywordInput('')
      inputRef.current?.focus()
      return
    }

    const next = [...keywords, keyword]

    onChange(stringifyKeywords(next))
    setKeywordInput('')
    inputRef.current?.focus()
  }

  const removeKeyword = (index: number) => {
    if (disabled) return

    const next = keywords.filter((_, i) => i !== index)

    onChange(stringifyKeywords(next))
  }

  const handleKeywordKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  const handleConditionalChange = (checked: boolean) => {
    if (onConditionalChange) {
      onConditionalChange(checked)
      return
    }

    onChange(checked ? 'true' : '')
  }

  const insertVariable = () => {
    if (disabled) return

    const index = variableIndex.trim()

    if (!/^\d+$/.test(index)) return

    const variable = `{${index}}`
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null

    if (!textarea) {
      onChange(`${value}${variable}`)
      return
    }

    const start = textarea.selectionStart ?? value.length
    const end = textarea.selectionEnd ?? value.length

    const nextValue = `${value.slice(0, start)}${variable}${value.slice(end)}`

    onChange(nextValue)

    window.requestAnimationFrame(() => {
      textarea.focus()

      const nextCursorPosition = start + variable.length
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition)
    })
  }

  if (!type) {
    return (
      <div className="company-param-value">
        <Label className="company-param-modal__label">Valor *</Label>

        <div className="company-param-value__empty">
          Seleccione un parámetro para configurar su valor.
        </div>

        {error && <div className="company-param-modal__error">{error}</div>}
      </div>
    )
  }

  if (type === 'Temp') {
    return (
      <div className="company-param-value">
        <Label htmlFor="value" className="company-param-modal__label">
          Tiempo *
        </Label>

        <TextField
          id="value"
          type="number"
          size="small"
          fullWidth
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          error={Boolean(error)}
          helperText={error || 'Ingrese el tiempo como número mayor que 0.'}
          inputProps={{
            min: 1,
            step: 1,
          }}
        />
      </div>
    )
  }

  if (type === 'Conditional') {
    return (
      <div className="company-param-value">
        <Label htmlFor="value" className="company-param-modal__label">
          Condición
        </Label>

        <div className="company-param-value__conditional">
          <label className="company-param-modal__switch">
            <input
              id="value"
              type="checkbox"
              checked={isConditionalChecked}
              disabled={disabled}
              onChange={(e) => handleConditionalChange(e.target.checked)}
            />
            <span />
          </label>

          <div className="company-param-value__conditional-text">
            <strong>{isConditionalChecked ? 'Activado' : 'Desactivado'}</strong>
            <small>
              {isConditionalChecked
                ? 'Se guardará como true.'
                : 'Se guardará como valor vacío.'}
            </small>
          </div>
        </div>

        {error && <div className="company-param-modal__error">{error}</div>}
      </div>
    )
  }

  if (type === 'Keywords') {
    return (
      <div className="company-param-value">
        <Label className="company-param-modal__label">
          Palabras clave *
        </Label>

        <div className="company-param-value__keywords-row">
          <Input
            ref={inputRef}
            type="text"
            value={keywordInput}
            disabled={disabled}
            maxLength={20}
            placeholder="Ej: Confirmar"
            className="company-param-value__keyword-input"
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
          />

          <Button
            type="button"
            variant="secondary"
            disabled={
              disabled ||
              !keywordInput.trim() ||
              keywordInput.trim().length > 20 ||
              keywords.length >= 10
            }
            onClick={addKeyword}
            className="company-param-value__keyword-btn"
          >
            Agregar
          </Button>
        </div>

        <div className="company-param-value__help">
          Máximo 10 palabras clave. Cada palabra debe tener máximo 20 caracteres.
        </div>

        <div className="company-param-value__chips">
          {keywords.map((keyword, index) => (
            <span key={`${keyword}-${index}`} className="company-param-value__chip">
              <span>{keyword}</span>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="company-param-value__chip-remove"
                  aria-label={`Quitar ${keyword}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}

          {keywords.length === 0 && (
            <span className="company-param-value__empty">
              Aún no has agregado palabras clave.
            </span>
          )}
        </div>

        {error && <div className="company-param-modal__error">{error}</div>}
      </div>
    )
  }

  return (
    <div className="company-param-value">
      <Label htmlFor={textareaId} className="company-param-modal__label">
        Valor *
      </Label>

      <div className="company-param-value__variables">
        <TextField
          label="Variable"
          type="number"
          size="small"
          value={variableIndex}
          disabled={disabled}
          onChange={(e) => setVariableIndex(e.target.value)}
          inputProps={{
            min: 0,
            step: 1,
          }}
          className="company-param-value__variable-input"
        />

        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !/^\d+$/.test(variableIndex.trim())}
          onClick={insertVariable}
          className="company-param-value__variable-btn"
        >
          Agregar {'{'}{variableIndex || 0}{'}'}
        </Button>
      </div>

      <Textarea
        id={textareaId}
        name="value"
        rows={7}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="company-param-modal__textarea"
        placeholder="Escriba el mensaje del parámetro"
      />

      <div className="company-param-value__help">
        {systemParamName
          ? `Mensaje para ${systemParamName}. Puede insertar variables como {0}, {1}, {2}.`
          : 'Puede insertar variables como {0}, {1}, {2}.'}
      </div>

      {error && <div className="company-param-modal__error">{error}</div>}
    </div>
  )
}
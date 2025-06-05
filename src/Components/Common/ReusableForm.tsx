/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import '@/Styles/Setting/SystemParamForm.css'

interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'email' | 'password'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  rows?: number
  validation?: (value: any) => string | undefined
}

interface ReusableFormProps {
  fields: FormField[]
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
  cancelLabel?: string
  className?: string
}

export const ReusableForm: React.FC<ReusableFormProps> = ({
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  className = ""
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    fields.forEach(field => {
      const value = formData[field.name]
      
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.name] = `${field.label} es requerido`
        return
      }

      if (field.validation && value) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]

    switch (field.type) {
      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className={`system-param-form__select ${error ? 'system-param-form__select--error' : ''}`}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            rows={field.rows || 3}
            placeholder={field.placeholder}
            className={`system-param-form__textarea ${error ? 'system-param-form__textarea--error' : ''}`}
          />
        )

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleInputChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className={`system-param-form__input ${error ? 'system-param-form__input--error' : ''}`}
          />
        )
    }
  }

  // ... keep existing code (rest of component logic)

  return (
    <form onSubmit={handleSubmit} className={`system-param-form ${className}`}>
      <div className="system-param-form__field-group system-param-form__field-group--full">
        {fields.map((field) => (
          <div key={field.name} className="system-param-form__field">
            <label htmlFor={field.name} className="system-param-form__label">
              {field.label} {field.required && <span className="system-param-form__required">*</span>}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <span className="system-param-form__error">{errors[field.name]}</span>
            )}
          </div>
        ))}
      </div>

      <div className="system-param-form__actions">
        <button
          type="button"
          onClick={onCancel}
          className="system-param-form__button system-param-form__button--secondary"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="system-param-form__button system-param-form__button--primary"
        >
          {isLoading ? (
            <span className="system-param-form__loading">
              <div className="system-param-form__spinner"></div>
              Guardando...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}

import React, { useState, useEffect } from 'react'
import type { SystemParamRequestDto, SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"

interface Props {
  initialData?: SystemParamResponseDto
  onSubmit: (data: SystemParamRequestDto) => void
  onCancel: () => void
  isLoading?: boolean
}

export const SystemParamForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
    type: 'string' as 'string' | 'number' | 'boolean'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        value: initialData.value,
        description: initialData.description,
        type: initialData.type === 'prompt' ? 'string' : initialData.type
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="system-param-form">
      <div className="system-param-form__field">
        <label htmlFor="name" className="system-param-form__label">
          Nombre del Parámetro *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="system-param-form__input"
          placeholder="Ej: max_connections"
        />
      </div>

      <div className="system-param-form__field">
        <label htmlFor="type" className="system-param-form__label">
          Tipo *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          required
          className="system-param-form__select"
        >
          <option value="string">Texto</option>
          <option value="number">Número</option>
          <option value="boolean">Booleano</option>
        </select>
      </div>

      <div className="system-param-form__field">
        <label htmlFor="value" className="system-param-form__label">
          Valor *
        </label>
        <input
          type={formData.type === 'number' ? 'number' : 'text'}
          id="value"
          name="value"
          value={formData.value}
          onChange={handleInputChange}
          required
          className="system-param-form__input"
          placeholder={
            formData.type === 'boolean' ? 'true o false' :
            formData.type === 'number' ? '100' :
            'Valor del parámetro'
          }
        />
      </div>

      <div className="system-param-form__field">
        <label htmlFor="description" className="system-param-form__label">
          Descripción *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          className="system-param-form__textarea"
          placeholder="Describe el propósito de este parámetro..."
        />
      </div>

      <div className="system-param-form__actions">
        <button
          type="button"
          onClick={onCancel}
          className="system-param-form__button system-param-form__button--secondary"
        >
          Cancelar
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
            initialData ? 'Actualizar' : 'Crear'
          )}
        </button>
      </div>
    </form>
  )
}
import React from 'react'
import '@/Styles/Common/Select.css'

interface Option {
  label: string
  value: string | number
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[]
  error?: string
  placeholder?: string
}

export default function Select({
  options,
  error,
  placeholder = 'Seleccione...',
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="select-wrapper">
      <select
        className={`select-field ${error ? 'select-field--error' : ''} ${className}`}
        {...props}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="select-error-message">{error}</span>}
    </div>
  )
}
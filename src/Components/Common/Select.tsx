import React from 'react';
import '@/Styles/Common/Select.css';

interface Option {
  label: string;
  value: string | number;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  error?: string;
  placeholder?: string;
}

export default function Select({
  options,
  error,
  placeholder = 'Seleccione...',
  className = '',
  multiple,
  id,
  name,
  ...props
}: SelectProps) {
  const selectId = id || name || 'select-id';

  return (
    <div className="select-wrapper">
      <select
        id={selectId}
        name={name}
        className={`select-field ${className} ${error ? 'select-field--error' : ''}`}
        multiple={multiple}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {/* Mostrar placeholder solo si no es múltiple */}
        {!multiple && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span id={`${selectId}-error`} className="select-error-message">
          {error}
        </span>
      )}
    </div>
  );
}
import React from 'react'
import '@/Styles/Common/Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  rightIcon?: React.ReactNode
  onIconClick?: () => void
}

export default function Input({
  error,
  rightIcon,
  onIconClick,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="input-wrapper">
      <div className="input-field-wrapper">
        <input
          className={`input-field ${error ? 'input-field--error' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="input-icon" onClick={onIconClick}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}
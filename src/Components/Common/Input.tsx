import React, { forwardRef } from 'react'
import '@/Styles/Common/Input.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  rightIcon?: React.ReactNode
  onIconClick?: () => void
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, rightIcon, onIconClick, className = '', ...props },
  ref
) {
  return (
    <div className="input-wrapper">
      <div className="input-field-wrapper">
        <input
          ref={ref}
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
})

export default Input
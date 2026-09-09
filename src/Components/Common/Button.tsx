import React from 'react'
import '@/Styles/Common/Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'destructive'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn--${variant} ${className}`}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden />}
      <span>{loading ? 'Cargando...' : children}</span>
    </button>
  )
}
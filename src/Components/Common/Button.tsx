import React from 'react'
import '@/Styles/Common/Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export default function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn btn--${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
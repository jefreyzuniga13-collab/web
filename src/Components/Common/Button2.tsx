
import React from 'react'
import '@/Styles/Common/Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...props
}) => {
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

export default Button
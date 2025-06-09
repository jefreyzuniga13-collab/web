
import React from 'react'
import '@/Styles/UI/textarea.css'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  success?: boolean
  size?: 'small' | 'default' | 'large'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, success, size = 'default', ...props }, ref) => {
    const getClassNames = () => {
      let classes = 'textarea'
      
      if (error) classes += ' textarea--error'
      if (success) classes += ' textarea--success'
      if (size !== 'default') classes += ` textarea--${size}`
      if (className) classes += ` ${className}`
      
      return classes
    }

    return (
      <textarea
        className={getClassNames()}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
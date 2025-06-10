import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import '@/Styles/UI/select.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {

  children?: React.ReactNode

  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  options?: SelectOption[]
  className?: string
  error?: boolean
  success?: boolean
  size?: 'small' | 'default' | 'large'
}

const Select = React.forwardRef<HTMLDivElement, React.PropsWithChildren<SelectProps>>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Seleccionar...',
      disabled = false,
      options = [],
      className = '',
      error,
      success,
      size = 'default',
      children,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value || defaultValue || '')
    const selectRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
      }
    }, [value])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
      if (disabled) return

      setSelectedValue(optionValue)
      setIsOpen(false)
      onValueChange?.(optionValue)
    }

    const toggleOpen = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
      }
    }

    const selectedOption = options.find(option => option.value === selectedValue)
    const displayText = selectedOption ? selectedOption.label : placeholder

    const getTriggerClassNames = () => {
      let classes = 'select-trigger'

      if (error) classes += ' select-trigger--error'
      if (success) classes += ' select-trigger--success'
      if (size !== 'default') classes += ` select-trigger--${size}`
      if (disabled) classes += ' select-trigger--disabled'
      if (isOpen) classes += ' select-trigger--open'
      if (!selectedValue) classes += ' select-trigger--placeholder'
      if (className) classes += ` ${className}`

      return classes
    }

    return (
      <div
        className="select-container"
        ref={selectRef}
        {...props}
      >
        <div
          ref={ref}
          className={getTriggerClassNames()}
          onClick={toggleOpen}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => {
            if (disabled) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleOpen()
            } else if (e.key === 'Escape') {
              setIsOpen(false)
            }
          }}
        >
          <span className="select-trigger__text">{displayText}</span>
          <ChevronDown className="select-trigger__icon" />
        </div>

        {isOpen && (
          <div className="select-content">
            <div className="select-viewport">
              {/* Si quieres seguir usando el API de options: */}
              {options.length > 0 ? (
                options.map(option => (
                  <div
                    key={option.value}
                    className={`select-item ${
                      option.disabled ? 'select-item--disabled' : ''
                    } ${selectedValue === option.value ? 'select-item--selected' : ''}`}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    role="option"
                    aria-selected={selectedValue === option.value}
                  >
                    <span className="select-item__indicator">
                      {selectedValue === option.value && (
                        <Check className="select-item__check" />
                      )}
                    </span>
                    <span className="select-item__text">{option.label}</span>
                  </div>
                ))
              ) : (
               
                children
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
)
export const SelectItem: React.FC<{
  value: string
  children: React.ReactNode
  disabled?: boolean
}> = ({ children }) => <>{children}</>
export const SelectTrigger: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children }) => <>{children}</>
export const SelectValue: React.FC<{
  placeholder?: string
}> = () => null

export { Select }

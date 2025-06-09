
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import '@/Styles/ui/MultiSelect.css'


interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  id?: string;
  name?: string;
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options, value, onChange, placeholder = "Seleccionar opciones", error, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string | number) => {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    };

    const removeOption = (optionValue: string | number, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter(v => v !== optionValue));
    };

    const getSelectedLabels = () => {
      return options
        .filter(option => value.includes(option.value))
        .map(option => option.label);
    };

    return (
      <div 
        ref={containerRef}
        className={`multi-select ${className || ''} ${error ? 'multi-select--error' : ''}`}
      >
        <div 
          className={`multi-select__trigger ${isOpen ? 'multi-select__trigger--open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="multi-select__value">
            {value.length === 0 ? (
              <span className="multi-select__placeholder">{placeholder}</span>
            ) : (
              <div className="multi-select__selected">
                {getSelectedLabels().map((label, index) => {
                  const optionValue = options.find(opt => opt.label === label)?.value;
                  return (
                    <span key={index} className="multi-select__tag">
                      {label}
                      <button
                        type="button"
                        className="multi-select__tag-remove"
                        onClick={(e) => optionValue && removeOption(optionValue, e)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <ChevronDown className={`multi-select__icon ${isOpen ? 'multi-select__icon--open' : ''}`} size={16} />
        </div>

        {isOpen && (
          <div className="multi-select__dropdown">
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`multi-select__option ${isSelected ? 'multi-select__option--selected' : ''}`}
                  onClick={() => toggleOption(option.value)}
                >
                  <span className="multi-select__option-text">{option.label}</span>
                  {isSelected && <Check size={16} />}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="multi-select__empty">No hay opciones disponibles</div>
            )}
          </div>
        )}

        {error && <span className="multi-select__error">{error}</span>}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
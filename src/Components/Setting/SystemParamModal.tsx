
import React from 'react'
import { X } from 'lucide-react'
import { SystemParamForm } from './SystemParamForm'
import type { SystemParamResponseDto, SystemParamRequestDto } from "@/Interfaces/Auth/AuthInterface"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SystemParamRequestDto) => void
  initialData?: SystemParamResponseDto
  title: string
  isLoading?: boolean
}

export const SystemParamModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  isLoading = false
}) => {
  if (!isOpen) return null

  return (
    <div className="system-param-modal">
      <div className="system-param-modal__backdrop">
        <div className="system-param-modal__overlay" onClick={onClose}></div>
        
        <div className="system-param-modal__content">
          <div className="system-param-modal__header">
            <h3 className="system-param-modal__title">{title}</h3>
            <button
              onClick={onClose}
              className="system-param-modal__close"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="system-param-modal__body">
            <SystemParamForm
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
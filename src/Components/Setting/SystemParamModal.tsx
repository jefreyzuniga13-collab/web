
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import SystemParamForm from './SystemParamForm';
import type { SystemParamRequestDto, SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
import '@/Styles/Setting/SystemParamModal.css'

interface SystemParamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SystemParamRequestDto) => void;
  initialData?: SystemParamResponseDto;
  title: string;
  isLoading?: boolean;
}

export const SystemParamModal: React.FC<SystemParamModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  initialData,
  title,
  isLoading = false
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div 
        className="modal__container modal__container--large" 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button 
            className="modal__close-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="modal__content">
          <SystemParamForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
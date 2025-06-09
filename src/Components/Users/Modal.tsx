
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import '@/Styles/Users/Modal.css'


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium' 
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
        className={`modal__container modal__container--${size}`} 
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
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
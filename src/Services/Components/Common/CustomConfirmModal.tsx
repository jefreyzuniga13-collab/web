import React from 'react';
import Button from '@/Services/Components/Common/Button';
import '@/Styles/Common/CustomConfirmModal.css';
import { MdDoneAll } from 'react-icons/md';
import { IoMdClose } from 'react-icons/io';

interface Props {
  title: string;
  subtitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isOpen?: boolean;
}

export const CustomConfirmModal = ({
  title,
  subtitle,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isOpen = true,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="ccm-overlay" onClick={onCancel}>
      <div 
        className="ccm-container" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="ccm-title"
        aria-describedby="ccm-subtitle"
        onClick={(e) => e.stopPropagation()} // Evita cerrar si se hace clic dentro
      >
        <div className="ccm-header-container">
          <h3 id="ccm-title" className="ccm-title">{title}</h3>
          <p id="ccm-subtitle" className="ccm-subtitle">{subtitle}</p>
        </div>

        <div className="ccm-buttons">
          <Button
            onClick={onCancel}
            variant="secondary" // Cambiado de 'destructive' para mejor jerarquía visual
          >
            {cancelText}
            <IoMdClose  fontSize={16}/>
          </Button>

          <Button
            onClick={onConfirm}
            variant="primary" // O 'destructive' según la acción requerida
          >
            {confirmText}
            <MdDoneAll fontSize={16}/>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirmModal;
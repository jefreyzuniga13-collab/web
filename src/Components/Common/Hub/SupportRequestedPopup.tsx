
import React, { useState } from 'react';
import { ModalPopup, type ModalAction } from './ModalPopup';

interface SupportEvent {
  type: string;
  payload: {
    conversationId: string;
    clientName: string;
    requestedAt: string;
  };
}

interface SupportRequestedPopupProps {
  event?: SupportEvent | null;
  isVisible?: boolean;
  onClose?: () => void;
}

export const SupportRequestedPopup: React.FC<SupportRequestedPopupProps> = ({
  event = {
    type: 'SupportRequested',
    payload: {
      conversationId: '123',
      clientName: 'Usuario Demo',
      requestedAt: new Date().toISOString()
    }
  },
  isVisible = true,
  onClose = () => console.log('Notification closed')
}) => {
  const [isOpen, setIsOpen] = useState(isVisible);

  if (!event || event.type !== 'SupportRequested') return null;

  const { conversationId, clientName, requestedAt } = event.payload;

  const actions: ModalAction[] = [
    {
      label: 'Ver conversación',
      onClick: () => {
        console.log(`Navegando a conversación: ${conversationId}`);
        // window.location.href = `/conversations/${conversationId}`;
        handleClose();
      },
      variant: 'primary'
    },
    {
      label: 'Cerrar',
      onClick: () => handleClose(),
      variant: 'secondary'
    }
  ];

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <ModalPopup
      title="Solicitud de soporte"
      message="Ha solicitado atención al cliente"
      actions={actions}
      isOpen={isOpen}
      onClose={handleClose}
      clientName={clientName}
      timestamp={requestedAt}
      icon="🎧"
    />
  );
};
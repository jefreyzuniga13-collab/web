import React, { useEffect, useState } from 'react';
import { getConversation } from '@/Utils/ApiConfig';
import type{ ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';

interface Props {
  conversationId?: number;
}

export const ContactDetail: React.FC<Props> = ({ conversationId }) => {
  const [conv, setConv] = useState<ConversationDto | null>(null);

  useEffect(() => {
    if (conversationId) {
      getConversation(conversationId)
        .then(res => setConv(res.data.data))
        .catch(console.error);
    }
  }, [conversationId]);

  if (!conv) return <div className="p-4">Selecciona una conversación</div>;

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-xl font-semibold">Datos del contacto</h3>
      <div>
        <strong>Nombre:</strong> {conv.contactName}
      </div>
      <div>
        <strong>Email:</strong> {conv.contactEmail ?? '—'}
      </div>
      <div>
        <strong>Estado:</strong> {conv.status}
      </div>
      {/* Añade más campos si los necesitas */}
    </div>
  );
};
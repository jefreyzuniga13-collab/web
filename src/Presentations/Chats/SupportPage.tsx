
import React, { useState, useEffect } from 'react';
import { SignalRProvider } from '@/Context/SignalRContext';
import { InboxList } from '@/Components/Chat/InboxList';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { AssignModal } from '@/Components/Chat/AssignModal';
import { ContactDetail } from '@/Components/Chat/ContactDetail';
import { getConversation } from '@/Utils/ApiConfig';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import '@/Styles/Chat/SupportPage.css';

const SupportPage: React.FC = () => {
  const [convId, setConvId] = useState<number | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [conversation, setConversation] = useState<ConversationDto | null>(null);
  const token = localStorage.getItem('jwt') ?? '';
  const userId = localStorage.getItem('userId') ?? 'agent456';

  // Cargar conversación al cambiar el ID
  useEffect(() => {
    if (!convId) {
      setConversation(null);
      return;
    }

    getConversation(convId)
      .then(res => setConversation(res.data.data))
      .catch(console.error);
  }, [convId]);

  // Función para refrescar datos después de asignar
  const handleAfterAssign = () => {
    if (!convId) return;
    
    getConversation(convId)
      .then(res => setConversation(res.data.data))
      .catch(console.error);
  };

  return (
    <SignalRProvider token={token}>
      <div className="support-layout">
        <aside className="sidebar">
          <div className="inbox-header">
            <h3 className="inbox-title">Conversaciones</h3>
            <select className="filter-dropdown">
              <option>Todos</option>
              <option>Sin asignar</option>
              <option>Asignados a mí</option>
            </select>
          </div>
          <InboxList selectedId={convId ?? undefined} onSelect={setConvId} />
        </aside>

        <main className="main-content">
          <header className="main-header">
            <h2 className="main-title">Chat</h2>
            <button
              disabled={!convId}
              className="assign-button"
              onClick={() => setShowAssign(true)}
            >
              Asignar
            </button>
          </header>

          <ChatWindow conversationId={convId ?? undefined} userId={userId} />
        </main>

        <aside className="info-sidebar">
          <ContactDetail conversationId={convId ?? undefined} />
        </aside>
      </div>

      <AssignModal
        conversation={conversation ?? undefined}
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={handleAfterAssign}
      />
    </SignalRProvider>
  );
};

export default SupportPage;
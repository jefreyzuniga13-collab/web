
import React, { useState, useEffect } from 'react';
import { SignalRProvider } from '@/Context/SignalRContext';
import { InboxList } from '@/Components/Chat/InboxList';
import { ChatWindow } from '@/Components/Chat/ChatWindow';
import { AssignModal } from '@/Components/Chat/AssignModal';
import { ContactDetail } from '@/Components/Chat/ContactDetail';
import { useUserRoles } from '@/Hooks/useUserRoles';
import { getConversation } from '@/Utils/ApiConfig';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import '@/Styles/Chat/SupportPage.css';

const SupportPage: React.FC = () => {
  const [convId, setConvId] = useState<number | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [conversation, setConversation] = useState<ConversationDto | null>(null);
  const [filterOption, setFilterOption] = useState<string>('all');
  const { isAdmin, userId } = useUserRoles();
  const token = localStorage.getItem('accessToken') ?? '';

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
            <select 
              className="filter-dropdown" 
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option value="all">Todos</option>
              {isAdmin && (
                <option value="pending">Sin asignar</option>
              )}
              <option value="mine">Asignados a mí</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>
          <InboxList 
            selectedId={convId ?? undefined} 
            onSelect={setConvId} 
            filter={filterOption} 
          />
        </aside>

        <main className="main-content">
          <header className="main-header">
            <h2 className="main-title">Chat</h2>
            {isAdmin && (
              <button
                disabled={!convId}
                className="assign-button"
                onClick={() => setShowAssign(true)}
              >
                Asignar
              </button>
            )}
            {!isAdmin && conversation?.assignedAgentId?.toString() === userId && (
              <button
                className="close-button"
                onClick={() => {/* Implementar cierre de conversación */}}
              >
                Cerrar
              </button>
            )}
          </header>

          <ChatWindow conversationId={convId ?? undefined} userId={Number(userId)} />
        </main>

        <aside className="info-sidebar">
          <ContactDetail conversationId={convId ?? undefined} />
        </aside>
      </div>

      {isAdmin && (
        <AssignModal
          conversation={conversation ?? undefined}
          isOpen={showAssign}
          onClose={() => setShowAssign(false)}
          onAssigned={handleAfterAssign}
        />
      )}
    </SignalRProvider>
  );
};

export default SupportPage;
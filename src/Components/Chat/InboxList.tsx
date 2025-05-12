
import React from 'react';
import { useConversations } from '@/Hooks/useConversations';
import '@/Styles/Chat/InboxList.css';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';

interface Props {
  selectedId?: number;
  onSelect: (id: number) => void;
}

export const InboxList: React.FC<Props> = ({ selectedId, onSelect }) => {
  const convs = useConversations();

  const formatTime = (iso?: string) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusClass = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('human')) return 'human';
    if (statusLower.includes('bot')) return 'bot';
    if (statusLower.includes('waiting') || statusLower.includes('awaiting')) return 'waiting';
    if (statusLower.includes('closed')) return 'closed';
    return 'default';
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'Bot': return 'Bot';
      case 'WaitingHuman': return 'Esperando';
      case 'AwaitingHumanConfirmation': return 'Esperando';
      case 'Human': return 'Humano';
      case 'Closed': return 'Cerrado';
      default: return status || 'Sin estado';
    }
  };

  return (
    <ul className="inbox-list">
      {convs.length === 0 && (
        <li className="inbox-list__empty">No hay conversaciones disponibles</li>
      )}

      {convs.map((c: ConversationDto) => {
        const isSelected = c.conversationId === selectedId;
        const lastTime = formatTime(c.updatedAt || c.createdAt);
        const statusClass = getStatusClass(c.status);
        const statusText = getStatusText(c.status);
        
        return (
          <li
            key={c.conversationId}
            onClick={() => onSelect(c.conversationId)}
            className={
              isSelected
                ? 'inbox-list__item inbox-list__item--selected'
                : 'inbox-list__item'
            }
          >
            <div className="inbox-list__top">
              <div className="inbox-list__avatar">
                {c.contactName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="inbox-list__details">
                <div className="inbox-list__name-row">
                  <span className="inbox-list__name">
                    {c.contactName || 'Usuario'}
                  </span>
                  <span className="inbox-list__time">{lastTime}</span>
                </div>
                {c.assignedAgent && (
                  <div className="inbox-list__agent">
                    Agente: <strong>{c.assignedAgent}</strong>
                  </div>
                )}
                <span className="inbox-list__preview">
                  {c.status === 'Closed'
                    ? 'Conversación cerrada'
                    : `${c.totalMensajes} mensaje(s) · ${c.duracion}`}
                </span>
              </div>
            </div>

            <span className={`inbox-list__status inbox-list__status--${statusClass}`}>
              {statusText}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
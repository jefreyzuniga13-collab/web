
import React from 'react';
import { useConversations } from '@/Hooks/useConversations';
import '@/Styles/Chat/InboxList.css';
import { MessageSquareOff } from 'lucide-react';

interface Props {
  selectedId?: number;
  onSelect: (id: number) => void;
  filter?: string;
}

export const InboxList: React.FC<Props> = ({ selectedId, onSelect, filter = 'all' }) => {
  const convs = useConversations(filter);
  
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('human')) return 'human';
    if (s.includes('bot')) return 'bot';
    if (s.includes('waiting')) return 'waiting';
    if (s.includes('closed')) return 'closed';
    return 'default';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Bot': return 'Bot';
      case 'WaitingHuman': return 'Esperando';
      case 'Human': return 'Humano';
      case 'Closed': return 'Cerrado';
      case 'New': return 'Nuevo';
      default: return status || 'Sin estado';
    }
  };

  if (convs.length === 0) {
    return (
      <ul className="inbox-list">
        <li className="inbox-list__empty">
          <MessageSquareOff size={48} />
          <span>No hay conversaciones disponibles</span>
        </li>
      </ul>
    );
  }

  return (
    <ul className="inbox-list">
      {convs.map(c => {
        const isSelected = c.conversationId === selectedId;
        const lastActivityDate = c.ultimaActividad || c.lastActivity || c.createdAt;
        const lastTime = formatTime(lastActivityDate);
        const statusClass = getStatusClass(c.status);
        const statusText = getStatusText(c.status);
        const hasUnread = (c.unreadCount || 0) > 0;

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
                {(c.contactName || c.contactNumber || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="inbox-list__details">
                <div className="inbox-list__name-row">
                  <span className="inbox-list__name">
                    {c.contactName || c.contactNumber || 'Usuario'}
                  </span>
                  <span className="inbox-list__time">{lastTime}</span>
                </div>
                {c.assignedAgentId && (
                  <div className="inbox-list__agent">
                    Agente: <strong>{c.assignedAgentName || c.assignedAgentId}</strong>
                  </div>
                )}
                <span className="inbox-list__preview">
                  {c.status === 'Closed'
                    ? 'Conversación cerrada'
                    : `${c.totalMensajes || c.totalMessages || 0} mensaje(s) · ${c.duracion || c.duration || '00:00'}`}
                </span>
              </div>
            </div>

            <div className="inbox-list__bottom">
              <span className={`inbox-list__status inbox-list__status--${statusClass}`}>
                {statusText}
              </span>
              {hasUnread && (
                <span className="inbox-list__unread-badge">{c.unreadCount}</span>
              )}
            </div>
            {hasUnread && <div className="inbox-list__unread-indicator"></div>}
          </li>
        );
      })}
    </ul>
  );
};
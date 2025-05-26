import React from 'react'
import { useConversations } from '@/Hooks/useConversations'
import '@/Styles/Chat/InboxList.css'
import { MessageSquareOff } from 'lucide-react'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'

interface Props {
  selectedId?: number
  onSelect: (id: number) => void
  filter?: 'all' | 'bot' | 'waiting' | 'human' | 'closed'
}

export const InboxList: React.FC<Props> = ({
  selectedId,
  onSelect,
  filter = 'all',
}) => {
  const { conversations } = useConversations(filter)
  console.log("Conversaciones componenes", conversations)

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('human')) return 'human'
    if (s.includes('bot')) return 'bot'
    if (s.includes('waiting')) return 'waiting'
    if (s.includes('closed')) return 'closed'
    return 'default'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'New':
        return 'Nuevo'
      case 'Bot':
        return 'Bot'
      case 'Waiting':
        return 'Esperando'
      case 'Human':
        return 'Humano'
      case 'Closed':
        return 'Cerrado'
      default:
        return status
    }
  }

  if (conversations.length === 0) {
    return (
      <ul className="inbox-list">
        <li className="inbox-list__empty">
          <MessageSquareOff size={48} />
          <span>No hay conversaciones disponibles</span>
        </li>
      </ul>
    )
  }

  return (
    <ul className="inbox-list">
      {conversations.map((c: ConversationDto) => {
        const isSelected = c.conversationId === selectedId
        const lastTime = formatTime(c.lastActivity || c.createdAt)
        const statusClass = getStatusClass(c.status)
        const statusText = getStatusText(c.status)
        const hasUnread = (c.unreadCount ?? 0) > 0

        return (
          <li
            key={c.conversationId}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => onSelect(c.conversationId)}
            onKeyDown={e => e.key === 'Enter' && onSelect(c.conversationId)}
            className={`inbox-list__item ${
              isSelected ? 'inbox-list__item--selected' : ''
            }`}
          >
            <div className="inbox-list__top">
              <div className="inbox-list__avatar">
                {(c.clientContactName || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="inbox-list__details">
                <div className="inbox-list__name-row">
                  <span className="inbox-list__name">
                    {c.clientContactName || 'Usuario'}
                  </span>
                  <span className="inbox-list__time">{lastTime}</span>
                </div>
                {c.assignedAgentName && (
                  <div className="inbox-list__agent">
                    Agente: <strong>{c.assignedAgentName}</strong>
                  </div>
                )}
                <span className="inbox-list__preview">
                  {c.status === 'Closed'
                    ? 'Conversación cerrada'
                    : `${c.totalMessages} mensaje(s) · ${c.duration}`}
                </span>
              </div>
            </div>
            <div className="inbox-list__bottom">
              <span
                className={`inbox-list__status inbox-list__status--${statusClass}`}
              >
                {statusText}
              </span>
              {hasUnread && (
                <span className="inbox-list__unread-badge">
                  {c.unreadCount}
                </span>
              )}
            </div>
            {hasUnread && <div className="inbox-list__unread-indicator" />}
          </li>
        )
      })}
    </ul>
  )
}
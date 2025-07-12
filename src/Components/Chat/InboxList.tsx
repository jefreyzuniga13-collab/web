import React, { useEffect, useState } from 'react'
import { useConversations } from '@/Hooks/useConversations'
import { MessageSquareOff } from 'lucide-react'
import { markConversationRead } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/InboxList.css'
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

interface Props {
  selectedId?: number
  onSelect: (id: number) => void
  filter?: 'all' | 'bot' | 'waiting' | 'human' | 'closed' | 'incomplete'
}

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export const InboxList: React.FC<Props> = ({ selectedId, onSelect, filter = 'all' }) => {
  const { conversations, reload } = useConversations(filter)
  const [now, setNow] = useState(Date.now())
  const authRaw = localStorage.getItem('auth') || '{}'
  const { userId } = JSON.parse(authRaw) as { userId: number }

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (iso?: string) => {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    return formatInTimeZone(date, 'America/Managua', 'HH:mm');
  } catch {
    return '';
  }
};

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

  const handleSelect = async (id: number) => {
    await markConversationRead(id)
    reload()
    onSelect(id)
  }

  return (
    <ul className="inbox-list">
      {conversations
        .slice()
        .sort(
          (a, b) =>
            new Date(b.lastActivity || b.createdAt).getTime() -
            new Date(a.lastActivity || a.createdAt).getTime()
        )
        .map((c: ConversationDto) => {
          const isSelected = c.conversationId === selectedId
          const lastTime = formatTime(c.lastActivity || c.createdAt)
          const statusClass = c.status.toLowerCase().includes('human')
            ? 'human'
            : c.status.toLowerCase().includes('bot')
            ? 'bot'
            : c.status.toLowerCase().includes('waiting')
            ? 'waiting'
            : c.status.toLowerCase().includes('closed')
            ? 'closed'
            : c.status.toLowerCase().includes('incomplete')
            ? 'incomplete'
            : 'default'
          const statusTextMap: Record<string, string> = {
            New: 'Nuevo',
            Bot: 'Bot',
            Waiting: 'Pendiente',
            Human: 'Humano',
            Closed: 'Cerrado',
            Incomplete: 'Incompleta'
          }
          const statusText = statusTextMap[c.status] || c.status
          const unread =
            userId === c.assignedAgentId
              ? c.unreadForAgent ?? 0
              : userId === c.assignedByUserId
              ? c.unreadForAssigner ?? 0
              : 0
          const hasUnread = unread > 0

          let timeSinceRequest = ''
          if (!c.assignedAt && c.requestedAgentAt) {
            timeSinceRequest = formatDuration(now - new Date(c.requestedAgentAt).getTime())
          }

          let timeToFirstResponse = ''
          if (c.assignedAt && !c.agentFirstMessageAt) {
            timeToFirstResponse = formatDuration(now - new Date(c.assignedAt).getTime())
          } else if (c.assignedAt && c.agentFirstMessageAt) {
            timeToFirstResponse = formatDuration(
              new Date(c.agentFirstMessageAt).getTime() - new Date(c.assignedAt).getTime()
            )
          }

          const clientLast = formatTime(c.clientLastMessageAt)
          let previewText = `Cliente últ. msj: ${clientLast}`
          if (!c.assignedAt && c.requestedAgentAt) {
            previewText += ` · Desde solicitud: ${timeSinceRequest}`
          }
          if (c.assignedAt && timeToFirstResponse) {
            previewText += ` · Hasta 1ª respuesta: ${timeToFirstResponse}`
          }

          return (
            <li
              key={c.conversationId}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => handleSelect(c.conversationId)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(c.conversationId)}
              className={`inbox-list__item${isSelected ? ' inbox-list__item--selected' : ''}`}
            >
              <div className="inbox-list__top">
                {/* <div className={`inbox-list__avatar ixl_conversation-tone__${c.tone}`}>
                  {(c.clientContactName || 'U').charAt(0).toUpperCase()}
                </div> */}
                <div className="inbox-list__details">
                  <div className="inbox-list__name-row">
                    <span className="inbox-list__name">{c.clientContactName || 'Usuario'}</span>
                    <span className="inbox-list__time">{lastTime}</span>
                  </div>
                  {c.assignedAgentName && (
                    <div className="inbox-list__agent">
                      Agente: <strong>{c.assignedAgentName}</strong>
                    </div>
                  )}
                  <span className="inbox-list__preview">{previewText}</span>
                </div>
                <div className="inbox-list__bottom">
                  <span className={`inbox-list__status inbox-list__status--${statusClass}`}>
                    {statusText}
                  </span>
                  {hasUnread && <span className="inbox-list__unread-badge">{unread}</span>}
                </div>
              </div>
            </li>
          )
        })}
    </ul>
  )
}
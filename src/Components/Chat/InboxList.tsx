import React, { useEffect, useState } from 'react'
import { useConversations } from '@/Hooks/useConversations'
import { MessageSquareOff } from 'lucide-react'
import { markConversationRead } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/InboxList.css'
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
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('human')) return 'human'
    if (s.includes('bot')) return 'bot'
    if (s.includes('waiting')) return 'waiting'
    if (s.includes('closed')) return 'closed'
    if (s.includes('incomplete')) return 'incomplete'
    return 'default'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'New': return 'Nuevo'
      case 'Bot': return 'Bot'
      case 'Waiting': return 'Pendiente'
      case 'Human': return 'Humano'
      case 'Closed': return 'Cerrado'
      case 'Incomplete': return 'Incompleta'
      default: return status
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

  const handleSelect = async (id: number) => {
    await markConversationRead(id)
    reload()
    onSelect(id)
  }

  return (
    <ul className="inbox-list">
      {[...conversations]
        .sort((a, b) => {
          const tA = new Date(a.lastActivity || a.createdAt).getTime()
          const tB = new Date(b.lastActivity || b.createdAt).getTime()
          return tB - tA
        })
        .map((c: ConversationDto) => {
          const isSelected = c.conversationId === selectedId
          const lastTime = formatTime(c.lastActivity || c.createdAt)
          const statusClass = getStatusClass(c.status)
          const statusText = getStatusText(c.status)
          const unread = userId === c.assignedAgentId
            ? c.unreadForAgent ?? 0
            : userId === c.assignedByUserId
            ? c.unreadForAssigner ?? 0
            : 0
          const hasUnread = unread > 0

          let timeSinceRequest = ''
          if (!c.assignedAt && c.requestedAgentAt) {
            const diff = now - new Date(c.requestedAgentAt).getTime()
            timeSinceRequest = formatDuration(diff)
          }

          let timeToFirstResponse = ''
          if (c.assignedAt && !c.agentFirstMessageAt) {
            const diff = now - new Date(c.assignedAt).getTime()
            timeToFirstResponse = formatDuration(diff)
          } else if (c.assignedAt && c.agentFirstMessageAt) {
            const diff = new Date(c.agentFirstMessageAt).getTime() - new Date(c.assignedAt).getTime()
            timeToFirstResponse = formatDuration(diff)
          }

          let previewText = `Cliente últ. msj: ${new Date(c.clientLastMessageAt).toLocaleTimeString()}`
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
              onKeyDown={e => e.key === 'Enter' && handleSelect(c.conversationId)}
              className={`inbox-list__item ${isSelected ? 'inbox-list__item--selected' : ''}`}
            >
              <div className="inbox-list__top">
                <div className="inbox-list__avatar">
                  {(c.clientContactName || 'U').charAt(0).toUpperCase()}
                </div>
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
                  {hasUnread && (
                    <span className="inbox-list__unread-badge">{unread}</span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
    </ul>
  )
}
import React, { useEffect, useState, useRef } from 'react'
import { useConversations } from '@/Hooks/useConversations'
import { MessageSquareOff } from 'lucide-react'
import '@/Styles/Chat/InboxList.css'
import { format } from 'date-fns'
import { markConversationRead } from '@/Services/ConversationService'

interface Props {
  selectedId?: number
  onSelect: (id: number | null) => void
  filter?: 'all' | 'bot' | 'waiting' | 'human' | 'closed' | 'incomplete'
}

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export const InboxList: React.FC<Props> = ({
  selectedId,
  onSelect,
  filter = 'all'
}) => {
  
  const loaderRef = useRef<HTMLLIElement>(null)

  const {
    conversations,
    loading,
    error,
    page,
    pagination,
    onPageChange
  } = useConversations(filter)

  const [now, setNow] = useState(Date.now())
  const { userId } = JSON.parse(localStorage.getItem('auth') || '{}') as {
    userId: number
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          page < pagination.totalPages &&
          !loading
        ) {
          onPageChange(page + 1)
        }
      },
      { root: null, rootMargin: '0px', threshold: 1.0 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [page, pagination.totalPages, loading, onPageChange])

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    try {
      return format(new Date(iso), 'HH:mm')
    } catch {
      return ''
    }
  }

   const formatDate = (iso?: string) => {
        if (!iso) return ''
        try {
          return format(new Date(iso), 'yyyy-MM-dd HH:mm')
        } catch {
          return ''
        }
  }


  const handleSelect = async (id: number) => {
  if (id === selectedId) {
    onSelect(null)
  } else {
    await markConversationRead(id)
    onSelect(id)
  }
}


  if (error) {
    return (
      <ul className="inbox-list">
        <li className="inbox-list__empty">{error}</li>
      </ul>
    )
  }

  if (conversations.length === 0 && !loading) {
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
      {conversations.map(c => {
        const isSelected = c.conversationId === selectedId
        const lastTime = formatDate(c.updatedAt || c.createdAt)
        const statusClass = c.status.toLowerCase()
        const statusTextMap: Record<string, string> = {
          bot: 'Bot',
          waiting: 'Pendiente',
          human: 'Asignado',
          closed: 'Cerrado',
          incomplete: 'Incompleta'
        }

        const statusText = statusTextMap[c.status.toLowerCase()] || c.status
        const unread =
          userId === c.assignedAgentId
            ? c.unreadForAgent ?? 0
            : userId === c.assignedByUserId
            ? c.unreadForAssigner ?? 0
            : 0
        const hasUnread = unread > 0

        let timeSinceRequest = ''
        if (!c.assignedAt && c.requestedAgentAt) {
          timeSinceRequest = formatDuration(
            now - new Date(c.requestedAgentAt).getTime()
          )
        }

        const clientLast = formatTime(c.clientLastMessageAt)
        let previewText = `Cliente últ. msj: ${clientLast}`
        if (!c.assignedAt && c.requestedAgentAt) {
          previewText += ` · Desde solicitud: ${timeSinceRequest}`
        }

        return (
          <li
            key={c.conversationId}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => handleSelect(c.conversationId)}
            onKeyDown={e =>
              e.key === 'Enter' && handleSelect(c.conversationId)
            }
            className={`inbox-list__item${
              isSelected ? ' inbox-list__item--selected' : ''
            }`}>
            <div className="inbox-list__top">
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
                <span className="inbox-list__preview">{previewText}</span>
              </div>
              <div className="inbox-list__bottom">
                <span
                  className={`inbox-list__status inbox-list__status--${statusClass}`}
                >
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
      {loading && (
        // <li className="inbox-list__loading">Cargando más conversaciones…</li>
        <></>
      )}
      <li ref={loaderRef} />
    </ul>
  )
}
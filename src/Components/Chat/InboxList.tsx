import React from 'react'
import { useConversations } from '@/Hooks/useConversations'
import '@/Styles/Chat/InboxList.css'
import { MessageSquareOff } from 'lucide-react'

interface Props {
  selectedId?: number
  onSelect: (id: number) => void
}

export const InboxList: React.FC<Props> = ({ selectedId, onSelect }) => {
  const convs = useConversations()
  const sorted = [...convs].sort(
    (a, b) =>
      new Date(b.ultimaActividad).getTime() -
      new Date(a.ultimaActividad).getTime()
  )

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

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
      case 'Bot': return 'Bot'
      case 'WaitingHuman': return 'Esperando'
      case 'Human': return 'Humano'
      case 'Closed': return 'Cerrado'
      default: return status || 'Sin estado'
    }
  }

  if (sorted.length === 0) {
    return (
      <ul className="inbox-list">
        <li className="inbox-list__empty">
          <MessageSquareOff />
          <span>No hay conversaciones disponibles</span>
        </li>
      </ul>
    )
  }

  return (
    <ul className="inbox-list">
      {sorted.map(c => {
        const isSelected = c.conversationId === selectedId
        const lastTime = formatTime(c.ultimaActividad)
        const statusClass = getStatusClass(c.status)
        const statusText = getStatusText(c.status)

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
                {/* {c.contactNumber.charAt(0).toUpperCase() || 'U'} */}
               <img src= {c.profilePhoto} alt="imagen" className='imagen-redonda'/>
              </div>
              <div className="inbox-list__details">
                <div className="inbox-list__name-row">
                  <span className="inbox-list__name">{c.contactName}</span>
                  <span className="inbox-list__time">{lastTime}</span>
                </div>
                {c.assignedAgent && (
                  <div className="inbox-list__agent">
                    Agente: <strong>{c.assignedAgentName}</strong>
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
        )
      })}
    </ul>
  )
}
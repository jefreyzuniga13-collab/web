
import React from 'react'
import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces'
import { useUserPresence } from '@/Hooks/useUserPresence'
import { useAssignedCount } from '@/Hooks/useAssignedCount'

interface AgentCardProps {
  agent: AgentDto
  isCompact?: boolean
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, isCompact = false }) => {
  const { isOnline } = useUserPresence(agent.userId)
  const assignedCount = useAssignedCount(agent.userId)

  // Generate avatar from initials if no imageUrl is provided
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarUrl = agent.imageUrl || null
  const initials = getInitials(agent.fullName)

  return (
    <div className={`agent-card ${isCompact ? 'agent-card--compact' : ''}`}>
      <div className="agent-card__avatar-container">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar de ${agent.fullName}`}
            className="agent-card__avatar"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('agent-card__initials--hidden')
            }}
          />
        ) : null}
        <div 
          className={`agent-card__initials ${avatarUrl ? 'agent-card__initials--hidden' : ''}`}
        >
          {initials}
        </div>
        <div className={`agent-card__status ${isOnline ? 'agent-card__status--online' : 'agent-card__status--offline'}`} />
      </div>
      
      <div className="agent-card__info">
        <div className="agent-card__name">{agent.fullName}</div>
        {!isCompact && (
          <>
            <div className="agent-card__email">{agent.email}</div>
            <div className="agent-card__stats">
              <span className="agent-card__count">{assignedCount} conversaciones</span>
              <span className={`agent-card__presence ${isOnline ? 'agent-card__presence--online' : 'agent-card__presence--offline'}`}>
                {isOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
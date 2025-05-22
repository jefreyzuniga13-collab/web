// src/Components/Chat/AgentOption.tsx
import React from 'react'
import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces'
import { useUserPresence } from '@/Hooks/useUserPresence'
import { useAssignedCount } from '@/Hooks/useAssignedCount'

export const AgentOption: React.FC<{ agent: AgentDto }> = ({ agent }) => {
  const { isOnline } = useUserPresence(agent.userId)
  const count = useAssignedCount(agent.userId)

  return (
    <option value={agent.userId}>
      {/* • verde=online, gris=offline */}
      {/* {isOnline ? '🟢' : '⚪️'} {agent.fullName} ({agent.email}) — {count} */}
      {isOnline ? '🟢' : '⚪️'} {agent.fullName} — {count}
    </option>
  )
}
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { AgentDto, ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
// import { getAgents } from '@/Services/auth/AgentService'
import { AgentService } from '@/Services/auth/AgentService'
import { assignAgent } from '@/Services/chat/ConversationService'
import { toast } from 'react-toastify'
import type { RootState, AppDispatch } from '@/Context/index'
import { closeAssignModal } from '@/Context/Slices/Chat/assignModalSlice'

interface AssignModalHook {
  conversation: ConversationDto | null | undefined
  isOpen: boolean
  agents: AgentDto[]
  loadingAgents: boolean
  loadingAgentId: number | null
  handleAssignAgent: (agentId: number) => Promise<void>
  handleClose: () => void
}

export function useAssignModal(): AssignModalHook {
  const dispatch = useDispatch<AppDispatch>()
  const { isOpen, conversation } = useSelector(
    (state: RootState) => state.assignModal
  )

  const [agents, setAgents] = useState<AgentDto[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [loadingAgentId, setLoadingAgentId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen || !conversation) return

    setLoadingAgents(true)

    AgentService.agentOnlineAsync()
      .then(res => {
        setAgents(res ?? [])
      })
      .catch(() => {
        toast.error('No se pudieron cargar los agentes.')
      })
      .finally(() => {
        setLoadingAgents(false)
      })
  }, [isOpen, conversation])

  const handleAssignAgent = async (agentId: number) => {
    if (!conversation) return

    if (conversation.assignedAgentId === agentId) {
      toast.info('La conversación ya está asignada a este agente.')
      return
    }

    setLoadingAgentId(agentId)

    try {
      await assignAgent(
        conversation.conversationId,
        agentId.toString(),
        'Human'
      )

      toast.success('Agente asignado correctamente.')
      dispatch(closeAssignModal())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const mensaje =
        err.response?.data?.message ||
        'No se pudo asignar el agente. Intenta nuevamente.'

      toast.error(mensaje)
    } finally {
      setLoadingAgentId(null)
    }
  }

  const handleClose = () => {
    if (loadingAgentId !== null) return
    dispatch(closeAssignModal())
  }

  return {
    conversation,
    isOpen,
    agents,
    loadingAgents,
    loadingAgentId,
    handleAssignAgent,
    handleClose
  }
}
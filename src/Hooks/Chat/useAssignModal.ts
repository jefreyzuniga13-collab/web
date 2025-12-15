import  { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { AgentDto, ConversationDto, ConversationStatus } from '@/Interfaces/Chat/ChatInterfaces'
import { getAgents } from '@/Services/AgentService'
import { assignAgent, closeConversation as apiCloseConversation } from '@/Services/ConversationService'
import { useUserPresence } from '@/Hooks/useUserPresence'
import { toast } from 'react-toastify'
import '@/styles/Chat/AssignModal.css'
import type { RootState, AppDispatch } from '@/Context/index'

import { closeAssignModal } from '@/Context/Slices/assignModalSlice'
interface AssignModalHook {
  isDropdownOpen: boolean
  statusOptions: { value: ConversationStatus; label: string; color: string }[]
  conversation: ConversationDto | null | undefined
  isOpen: boolean
  selectedAgent: string
  selectedAgentData: AgentDto | undefined
  agents: AgentDto[]
  selectedIsOnline: boolean
  setIsDropdownOpen: (open: boolean) => void
  setSelectedAgent: (agentId: string) => void
  handleAssign: () => Promise<void>
  handleStatusChange: (newStatus: ConversationStatus) => void
  handleClose: () => void
  loading:boolean;
}
  

export function useAssignModal () :  AssignModalHook{
 const dispatch = useDispatch<AppDispatch>()
  const { isOpen, conversation } = useSelector((state: RootState) => state.assignModal)

  const [agents, setAgents] = useState<AgentDto[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [status, setStatus] = useState<ConversationStatus>('Bot')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState<boolean>(false)

  const selectedAgentId = selectedAgent ? Number(selectedAgent) : 0
  const { isOnline: selectedIsOnline } = useUserPresence(selectedAgentId)

  const statusOptions: { value: ConversationStatus; label: string; color: string }[] = [
    { value: 'Closed', label: 'Cerrar', color: 'closed' },
     { value: 'Human', label: 'Asignar', color: 'human' },
  ]

  // Al abrir, cargar agentes y estado inicial
  useEffect(() => {
    if (!isOpen || !conversation) return

    setSelectedAgent(conversation.assignedAgentId?.toString() ?? '')
    setStatus(conversation.status)

    getAgents()
      .then(res => setAgents(res.data.data))
      .catch(console.error)
  }, [isOpen, conversation])

  const handleStatusChange = (newStatus: ConversationStatus) => {
    if (newStatus === 'Human') {
      if (!selectedAgent) {
        toast.warn('Debes seleccionar un agente antes de asignar.')
        return
      }
      if (!selectedIsOnline) {
        toast.warn('No puedes asignar a un agente desconectado.')
        return
      }
    }
    if (newStatus === 'Bot' && selectedAgent) {
      toast.warn('No puedes establecer Bot cuando hay un agente seleccionado.')
      return
    }
    setStatus(newStatus)
  }

  const handleAssign = async () => {
    if (!conversation) return

    setLoading(true)
    try {
      if (status === 'Closed') {
        await apiCloseConversation(conversation.conversationId)
        toast.success('Conversación cerrada correctamente.')
      } else if (status === 'Human') {
        await assignAgent(conversation.conversationId, selectedAgent, status)
        toast.success('Agente asignado correctamente.')
      } else {
        toast.warn('No se aplicaron cambios.')
        setLoading(false)
        return
      }
      setLoading(false)
      dispatch(closeAssignModal())
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   } catch (err: any) {
      const mensaje = err.response?.data?.message || 'Por favor, intenta de nuevo.';
      toast.error(mensaje);
    }
  }

  const handleClose = () => {
    dispatch(closeAssignModal())
  }

  const selectedAgentData = agents.find(a => a.userId.toString() === selectedAgent)

  return {
    isDropdownOpen,
    statusOptions,
    conversation,
    selectedAgent,
    isOpen,
    selectedAgentData,
    agents,
    selectedIsOnline,
    setIsDropdownOpen,
    setSelectedAgent,
    handleAssign,
    handleStatusChange,
    handleClose,
    loading,
  }
}
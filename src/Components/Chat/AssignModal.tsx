import React, { useEffect, useState } from 'react'
import type { AgentDto, ConversationDto, ConversationStatus } from '@/Interfaces/Chat/ChatInterfaces'
import { getAgents } from '@/Services/AgentService'
import { assignAgent, closeConversation } from '@/Services/ConversationService'
import { useUserPresence } from '@/Hooks/useUserPresence'
import { toast } from 'react-toastify'
import { X } from 'lucide-react'
import { AgentCard } from '@/Components/Chat/AgentCard'
import '@/styles/Chat/AssignModal.css'

interface AssignModalProps {
  conversation?: ConversationDto
  isOpen: boolean
  onClose: () => void
  onAssigned?: () => void
}

export const AssignModal: React.FC<AssignModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onAssigned,
}) => {
  const [agents, setAgents] = useState<AgentDto[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [status, setStatus] = useState<ConversationStatus>('Bot')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedAgentId = selectedAgent ? Number(selectedAgent) : 0
  const { isOnline: selectedIsOnline } = useUserPresence(selectedAgentId)

  // Opciones de estado con color para estilos
  const statusOptions: { value: ConversationStatus; label: string; color: string }[] = [
    { value: 'Bot', label: 'Bot', color: 'bot' },
    { value: 'Human', label: 'Humano', color: 'human' },
    { value: 'Closed', label: 'Cerrado', color: 'closed' },
  ]

  useEffect(() => {
    if (!isOpen || !conversation) return

    // Inicializamos selección y estado
    setSelectedAgent(conversation.assignedAgentId?.toString() ?? '')
    setStatus(conversation.status)

    getAgents()
      .then(res => setAgents(res.data.data))
      .catch(console.error)
  }, [isOpen, conversation])

  // Controla la lógica al cambiar estado
  const handleStatusChange = (newStatus: ConversationStatus) => {

    if (newStatus === 'Human') {
      if (!selectedAgent) {
        toast.warn('Debes seleccionar un agente antes de asignar Humano.')
        return
      }
      if (!selectedIsOnline) {
        toast.warn('No puedes asignar Humano a un agente desconectado.')
        return
      }
    }

    if (newStatus === 'Bot' && selectedAgent) {
      toast.warn('No puedes establecer Bot cuando hay un agente seleccionado.')
      return
    }

    // 'Closed' siempre permitido
    setStatus(newStatus)
  }

  // Ejecuta la asignación o cierre
  const handleAssign = async () => {
    if (!conversation) return

    // if (!selectedIsOnline && assignAgent !== null) {
    //     toast.warn('No puedes asignar Humano a un agente desconectado.')
    //     return
    //   } 

    try {
      if (status === 'Closed') {
        await closeConversation(conversation.conversationId)
        toast.success('Cambios guardados exitosamente.')
      } else {
      
        if(status == 'Human'){
            await assignAgent(conversation.conversationId, selectedAgent, status);
            toast.success('Cambios guardados exitosamente.')
        }
        else toast.warn('El estado no ha cambiado, dado que no has seleccionado uno nuevo')
      }

      onAssigned?.()
      onClose()
    } catch {
      toast.error('Error al guardar los cambios.')
    }
  }

  const selectedAgentData = agents.find(a => a.userId.toString() === selectedAgent)
  if (!isOpen) return null

  return (
    <div className="assign-modal__overlay">
      <div className="assign-modal__container">
        {/* Header */}
        <header className="assign-modal__header">
          <div className="assign-modal__header-content">
            <h2 className="assign-modal__title">
              Asignar agente a{' '}
              <span className="assign-modal__client-name">
                {conversation?.clientContactName ?? `#${conversation?.conversationId}`}
              </span>
            </h2>
            <button
              className="assign-modal__close-button"
              onClick={onClose}
              aria-label="Cerrar modal"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="assign-modal__body">
          <div className="assign-modal__field">
            <label className="assign-modal__label">Seleccionar agente</label>
            <div className="assign-modal__dropdown">
              <button
                type="button"
                className="assign-modal__dropdown-trigger"
                onClick={() => setIsDropdownOpen(open => !open)}
                aria-expanded={isDropdownOpen}
              >
                {selectedAgentData ? (
                  <div className="assign-modal__selected-agent">
                    <AgentCard agent={selectedAgentData} isCompact />
                  </div>
                ) : (
                  <span className="assign-modal__placeholder">
                    — Selecciona un agente —
                  </span>
                )}
                <svg
                  className={`assign-modal__dropdown-icon ${
                    isDropdownOpen ? 'assign-modal__dropdown-icon--open' : ''
                  }`}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4.427 6.573L8 10.146l3.573-3.573a.5.5 0 0 1 .707.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 1 1 .708-.708z" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="assign-modal__dropdown-menu">
                  <div className="assign-modal__dropdown-content">
                    <button
                      type="button"
                      className="assign-modal__dropdown-item"
                      onClick={() => {
                        setSelectedAgent('')
                        setIsDropdownOpen(false)
                      }}
                    >
                      — Selecciona un agente —
                    </button>
                    {agents.map(agent => (
                      <button
                        key={agent.userId}
                        type="button"
                        className="assign-modal__dropdown-item"
                        onClick={() => {
                          setSelectedAgent(agent.userId.toString())
                          setIsDropdownOpen(false)
                        }}
                      >
                        <AgentCard agent={agent} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estado de la conversación */}
          <div className="assign-modal__field">
            <label className="assign-modal__label">Estado de la conversación</label>
            <div className="assign-modal__status-grid">
              {statusOptions.map(option => (
                <label
                  key={option.value}
                  className={`assign-modal__status-option assign-modal__status-option--${option.color} ${
                    status === option.value ? 'assign-modal__status-option--selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="conversation-status"
                    value={option.value}
                    checked={status === option.value}
                    disabled={
                      option.value === 'Human'
                        ? !(selectedAgent && selectedIsOnline)
                        : option.value === 'Bot'
                        ? !!selectedAgent
                        : false
                    }
                    onChange={() => handleStatusChange(option.value)}
                    className="assign-modal__status-radio"
                  />
                  <span className="assign-modal__status-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="assign-modal__footer">
          <button
            type="button"
            className="assign-modal__button assign-modal__button--secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="assign-modal__button assign-modal__button--primary"
            onClick={handleAssign}
          >
            Guardar cambios
          </button>
        </footer>
      </div>
    </div>
  )
}
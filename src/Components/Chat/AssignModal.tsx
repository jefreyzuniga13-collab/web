
import React, { useEffect, useState } from 'react'
import type {
  AgentDto,
  ConversationDto,
  ConversationStatus,
} from '@/Interfaces/Chat/ChatInterfaces'
import { getAgents } from '@/Services/AgentService'
import { assignAgent, closeConversation } from '@/Services/ConversationService'
import { useUserPresence } from '@/Hooks/useUserPresence'
import {toast} from 'react-toastify'
import { X } from 'lucide-react'
//import { AgentOption } from '@/Components/Chat/AgentOption'
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

  const { isOnline: selectedIsOnline } = useUserPresence(
    selectedAgent ? Number(selectedAgent) : 0
  )

  const statusOptions: { value: ConversationStatus; label: string; color: string }[] = [
    { value: 'Bot', label: 'Bot', color: 'bot' },
    { value: 'Human', label: 'Humano', color: 'human' },
    { value: 'Closed', label: 'Cerrado', color: 'closed' },
  ]

  useEffect(() => {
    if (!isOpen || !conversation) return

    setSelectedAgent(conversation.assignedAgentId?.toString() ?? '')
    setStatus(conversation.status)

    getAgents()
      .then(res => setAgents(res.data.data))
      .catch(console.error)
  }, [isOpen, conversation])

  const handleAssign = async () => {
    if (!conversation || (!selectedAgent && status !== 'Closed')) return

    if (!selectedIsOnline && (!selectedAgent && status !== 'Closed')) {
      toast.warn("No puedes asignar un agente que está desconectado.")
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      status !== 'Closed' 
        ? await assignAgent(conversation.conversationId, selectedAgent, status) 
        : await closeConversation(conversation.conversationId)

      toast.success("Agente asignado correctamente.")
      onAssigned?.()
      onClose()
    } catch {
      toast.error("Error al asignar agente.")
    }
  }

  const selectedAgentData = agents.find(agent => agent.userId.toString() === selectedAgent)

  if (!isOpen) return null

  return (
    <div className="assign-modal__overlay">
      <div className="assign-modal__container">
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

        <div className="assign-modal__body">
          <div className="assign-modal__field">
            <label className="assign-modal__label">
              Seleccionar agente
            </label>
            
            <div className="assign-modal__dropdown">
              <button
                type="button"
                className="assign-modal__dropdown-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
                  className={`assign-modal__dropdown-icon ${isDropdownOpen ? 'assign-modal__dropdown-icon--open' : ''}`}
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="currentColor"
                >
                  <path d="M4.427 6.573L8 10.146l3.573-3.573a.5.5 0 0 1 .707.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 1 1 .708-.708z"/>
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
                      <span className="assign-modal__dropdown-item-text">
                        — Selecciona un agente —
                      </span>
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

            {selectedAgent && !selectedIsOnline && (
              <div className="assign-modal__warning">
                <span className="assign-modal__warning-icon">⚠️</span>
                Este agente no está conectado.
              </div>
            )}
          </div>

          <div className="assign-modal__field">
            <label className="assign-modal__label">
              Estado de la conversación
            </label>
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
                    onChange={() => setStatus(option.value)}
                    className="assign-modal__status-radio"
                  />
                  <span className="assign-modal__status-label">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

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
            disabled={
              (!selectedAgent && status !== 'Closed' && !selectedIsOnline) ||
              (status === conversation?.status &&
               selectedAgent === conversation.assignedAgentId?.toString())
            }
          >
            Guardar cambios
          </button>
        </footer>
      </div>
    </div>
  )
}
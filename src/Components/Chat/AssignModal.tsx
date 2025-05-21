import React, { useEffect, useState } from 'react'
import type {
  AgentDto,
  ConversationDto,
  ConversationStatus,
} from '@/Interfaces/Chat/ChatInterfaces'
import { getAgents } from '@/Services/AgentService'
import { assignAgent } from '@/Services/ConversationService'
import { X } from 'lucide-react'
import '@/Styles/Chat/AssignModal.css'

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
  const [sel, setSel] = useState<string>('')
  const [status, setStatus] = useState<ConversationStatus>('Bot')

  // Todas las opciones de estado con su etiqueta
  const statusOptions: { value: ConversationStatus; label: string }[] = [
    { value: 'New', label: 'Nuevo' },
    { value: 'Bot', label: 'Bot' },
    { value: 'Waiting', label: 'Esperando' },
    { value: 'Human', label: 'Humano' },
    { value: 'Closed', label: 'Cerrado' },
  ]

  // Cuando se abre el modal, precargamos valores y cargamos agentes
  useEffect(() => {
    if (!isOpen || !conversation) return

    setSel(conversation.assignedAgentId?.toString() ?? '')
    setStatus(conversation.status)

    getAgents()
      .then(res => setAgents(res.data.data))
      .catch(console.error)
  }, [isOpen, conversation])

  const handleAssign = async () => {
    if (!conversation || !sel) return
    try {
      await assignAgent(conversation.conversationId, sel, status)
      onAssigned?.()
      onClose()
    } catch (err) {
      console.error('Error al asignar agente:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="assign-modal__backdrop">
      <div className="assign-modal">
        <header className="assign-modal__header">
          <h2 className="assign-modal__title">
            Asignar agente a{' '}
            <strong>
              {conversation?.clientContactName ??
                `#${conversation?.conversationId}`}
            </strong>
          </h2>
          <button
            className="assign-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="assign-modal__field">
          <label htmlFor="agent-select" className="assign-modal__label">
            Seleccionar agente
          </label>
          <select
            id="agent-select"
            className="assign-modal__select"
            value={sel}
            onChange={e => setSel(e.target.value)}
          >
            <option value="">— Selecciona un agente —</option>
            {agents.map(agent => (
              <option key={agent.userId} value={agent.userId}>
                {agent.fullName} ({agent.email})
              </option>
            ))}
          </select>
        </div>

        <div className="assign-modal__field">
          <label className="assign-modal__label">Estado de la conversación</label>
          <div className="assign-modal__status">
            {statusOptions.map(opt => (
              <div className="status-option" key={opt.value}>
                <input
                  type="radio"
                  id={`status-${opt.value.toLowerCase()}`}
                  name="status"
                  value={opt.value}
                  checked={status === opt.value}
                  onChange={() => setStatus(opt.value)}
                  className="status-radio"
                />
                <label
                  htmlFor={`status-${opt.value.toLowerCase()}`}
                  className={`status-label status-${opt.value.toLowerCase()}`}
                >
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <footer className="assign-modal__actions">
          <button
            className="assign-modal__button assign-modal__button--secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="assign-modal__button assign-modal__button--primary"
            onClick={handleAssign}
            disabled={
              !sel ||
              (status === conversation?.status &&
                sel === conversation.assignedAgentId?.toString())
            }
          >
            Guardar cambios
          </button>
        </footer>
      </div>
    </div>
  )
}
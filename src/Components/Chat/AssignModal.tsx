/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useEffect, useState } from 'react'
import type {
  AgentDto,
  ConversationDto,
  ConversationStatus,
} from '@/Interfaces/Chat/ChatInterfaces'
import { getAgents } from '@/Services/AgentService'
import { assignAgent, closeConversation } from '@/Services/ConversationService'
import { useUserPresence } from '@/Hooks/useUserPresence'
import { toast } from 'react-toastify'
import { X } from 'lucide-react'
import '@/Styles/Chat/AssignModal.css'
import { AgentOption } from '@/Components/Chat/AgentOption'

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

  // Hook para presencia del agente seleccionado (solo primera carga)
  const { isOnline: selectedIsOnline } = useUserPresence(
  sel ? Number(sel) : 0
)

  const statusOptions: { value: ConversationStatus; label: string }[] = [
    // { value: 'New',     label: 'Nuevo'     },
    { value: 'Bot',     label: 'Bot'       },
    // { value: 'Waiting', label: 'Esperando' },
    { value: 'Human',   label: 'Humano'    },
    { value: 'Closed',  label: 'Cerrado'   },
  ]

  useEffect(() => {
    if (!isOpen || !conversation) return

    setSel(conversation.assignedAgentId?.toString() ?? '')
    setStatus(conversation.status)

    getAgents()
      .then(res => setAgents(res.data.data))
      .catch(console.error)
  }, [isOpen, conversation])

  const handleAssign = async () => {
    if (!conversation || (!sel && status !== 'Closed')) return

    if (!selectedIsOnline) {
      toast.error('No puedes asignar un agente que está desconectado.')
      return
    }

    try {
      
    status !== 'Closed' ? await assignAgent(conversation.conversationId, sel, status) 
    : await closeConversation(conversation.conversationId);

      toast.success('Agente asignado correctamente.')
      onAssigned?.()
      onClose()
    } catch {
      toast.error('Error al asignar agente.')
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
              {conversation?.clientContactName ?? `#${conversation?.conversationId}`}
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
              <AgentOption key={agent.userId} agent={agent} />
            ))}
          </select>
          {sel && !selectedIsOnline && (
            <p className="assign-modal__warning">
              ⚠️ Este agente no está conectado.
            </p>
          )}
        </div>

        <div className="assign-modal__field">
          <label className="assign-modal__label">
            Estado de la conversación
          </label>
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
              (!sel && status !== 'Closed' && !selectedIsOnline) ||
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
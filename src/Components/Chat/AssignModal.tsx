import { X } from 'lucide-react'
import { AgentCard } from '@/Components/Chat/AgentCard'
import { useAssignModal } from '@/Hooks/Chat/useAssignModal'
import '@/styles/Chat/AssignModal.css'

export const AssignModal: React.FC = () => {
  const {
    conversation,
    isOpen,
    agents,
    handleAssignAgent,
    handleClose,
    loadingAgentId,
    loadingAgents
  } = useAssignModal()

  if (!isOpen || !conversation) return null

  return (
    <div className="assign-modal__overlay">
      <div className="assign-modal__container">
        <header className="assign-modal__header">
          <div className="assign-modal__header-content">
            <h2 className="assign-modal__title">
              Asignar agente a{' '}
              <span className="assign-modal__client-name">
                {conversation.clientContactName ?? `#${conversation.conversationId}`}
              </span>
            </h2>

            <button
              className="assign-modal__close-button"
              onClick={handleClose}
              aria-label="Cerrar modal"
              type="button"
              disabled={loadingAgentId !== null}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="assign-modal__body">
          {loadingAgents ? (
            <div className="assign-modal__empty">
              Cargando agentes...
            </div>
          ) : agents.length === 0 ? (
            <div className="assign-modal__empty">
              No hay agentes disponibles.
            </div>
          ) : (
            <div className="assign-modal__agents-list">
              {agents.map(agent => {
                const isAssigned = true

                const isLoading =
                  loadingAgentId === agent.userId

                // const isDisabled =
                //   loadingAgentId !== null || isAssigned

                return (
                  <button
                    key={agent.userId}
                    type="button"
                    className={`assign-modal__agent-button 
                     
                    `
                  }
                    onClick={() => handleAssignAgent(agent.userId)}
                    // disabled={isDisabled}
                  >
                    <AgentCard agent={agent} />

                    <span className="assign-modal__agent-action">
                      {isLoading
                        ? 'Asignando...'
                        : isAssigned
                        ? 'Asignado'
                        : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
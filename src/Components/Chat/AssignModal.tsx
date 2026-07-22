import type { MouseEvent } from "react"
import { LoaderCircle, X } from "lucide-react"

import { AgentCard } from "@/Components/Chat/AgentCard"
import { useAssignModal } from "@/Hooks/Chat/useAssignModal"

import "@/styles/Chat/AssignModal.css"

export const AssignModal: React.FC = () => {
  const {
    conversation,
    isOpen,
    agents,
    handleAssignAgent,
    handleClose,
    loadingAgentId,
    loadingAgents,
    isSubmitting,
  } = useAssignModal()

  if (!isOpen || !conversation) {
    return null
  }

  const isReassigning =
    Number(conversation.assignedAgentId ?? 0) > 0

  const handleOverlayClick = (
    event: MouseEvent<HTMLDivElement>
  ): void => {
    if (event.target !== event.currentTarget) {
      return
    }

    handleClose()
  }

  return (
    <div
      className="assign-modal__overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="assign-modal__container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-modal-title"
      >
        <header className="assign-modal__header">
          <div className="assign-modal__header-content">
            <h2
              id="assign-modal-title"
              className="assign-modal__title"
            >
              {isReassigning
                ? "Reasignar conversación "
                : "Asignar agente "}

              <span className="assign-modal__client-name">
                {conversation.clientContactName ??
                  `#${conversation.conversationId}`}
              </span>
            </h2>

            <button
              className="assign-modal__close-button"
              onClick={handleClose}
              aria-label="Cerrar modal"
              type="button"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="assign-modal__body">
          {loadingAgents ? (
            <div className="assign-modal__empty">
              <LoaderCircle
                size={18}
                className="assign-modal__loading-icon"
              />

              <span>Cargando agentes...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="assign-modal__empty">
              No hay agentes disponibles.
            </div>
          ) : (
            <div className="assign-modal__agents-list">
              {agents.map((agent) => {
                const isAssigned =
                  Number(conversation.assignedAgentId ?? 0) ===
                  Number(agent.userId)

                const isLoading =
                  loadingAgentId === agent.userId

                /*
                 * Al iniciar una asignación se bloquean todos
                 * los agentes para evitar múltiples peticiones.
                 */
                const isDisabled =
                  isSubmitting || isAssigned

                let actionText = isReassigning
                  ? "Reasignar"
                  : "Asignar"

                if (isAssigned) {
                  actionText = "Asignado"
                }

                if (isLoading) {
                  actionText = isReassigning
                    ? "Reasignando..."
                    : "Asignando..."
                }

                return (
                  <button
                    key={agent.userId}
                    type="button"
                    className={[
                      "assign-modal__agent-button",
                      isAssigned
                        ? "assign-modal__agent-button--assigned"
                        : "",
                      isLoading
                        ? "assign-modal__agent-button--loading"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      void handleAssignAgent(agent.userId)
                    }
                    disabled={isDisabled}
                    aria-busy={isLoading}
                  >
                    <AgentCard agent={agent} />

                    <span className="assign-modal__agent-action">
                      {isLoading && (
                        <LoaderCircle
                          size={16}
                          className="assign-modal__loading-icon"
                        />
                      )}

                      <span>{actionText}</span>
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
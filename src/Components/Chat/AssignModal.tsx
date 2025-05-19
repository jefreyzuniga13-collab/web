
import React, { useEffect, useState } from 'react';
import type { AgentDto, ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import { getAgents, assignAgent } from '@/Utils/ApiConfig';
import { X } from 'lucide-react';
import '@/Styles/Chat/AssignModal.css';

interface Props {
  conversation?: ConversationDto;
  isOpen: boolean;
  onClose: () => void;
  onAssigned?: () => void;
}

export const AssignModal: React.FC<Props> = ({
  conversation,
  isOpen,
  onClose,
  onAssigned,
}) => {
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [sel, setSel] = useState<string>('');
  const [status, setStatus] = useState<string>('Bot');
  const convId = conversation?.conversationId;

  useEffect(() => {
    if (!isOpen || !conversation) return;

    // Precargamos estados
    setSel(conversation.assignedAgentId?.toString() ?? '');
    setStatus(conversation.status);

    // Cargamos agentes
    getAgents()
      .then(res => setAgents(res.data.data))
      .catch(console.error);
  }, [isOpen, conversation]);

  const handleAssign = async () => {
    if (!convId || !sel) return;
    try {
      await assignAgent(convId, sel, status);
      onClose();
      onAssigned?.();
    } catch (error) {
      console.error('Error al asignar agente:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="assign-modal__backdrop">
      <div className="assign-modal">
        <div className="assign-modal__header">
          <h2 className="assign-modal__title">
            Asignar agente a conversación #{conversation?.conversationId}
          </h2>
          <button 
            className="assign-modal__close" 
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="assign-modal__field">
          <label className="assign-modal__label" htmlFor="agent-select">
            Seleccionar agente
          </label>
          <select
            id="agent-select"
            className="assign-modal__select"
            value={sel}
            onChange={e => setSel(e.target.value)}
          >
            <option value="">— Selecciona un agente —</option>
            {agents.map(a => (
              <option key={a.userId} value={a.userId}>
                {a.fullName} ({a.email})
              </option>
            ))}
          </select>
        </div>

        <div className="assign-modal__field">
          <label className="assign-modal__label">
            Estado de la conversación
          </label>
          <div className="assign-modal__status">
            {['Bot', 'WaitingHuman', 'Human', 'Closed'].map(s => (
              <div className="status-option" key={s}>
                <input
                  type="radio"
                  id={`status-${s.toLowerCase()}`}
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="status-radio"
                />
                <label
                  htmlFor={`status-${s.toLowerCase()}`}
                  className={`status-label status-${s.toLowerCase()}`}
                >
                  {s === 'Bot'
                    ? 'Bot'
                    : s === 'WaitingHuman'
                    ? 'Esperando'
                    : s === 'Human'
                    ? 'Humano'
                    : 'Cerrado'}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="assign-modal__actions">
          <button
            className="assign-modal__button assign-modal__button--secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="assign-modal__button assign-modal__button--primary"
            disabled={!sel || (status === conversation?.status && sel === conversation?.assignedAgentId?.toString())}
            onClick={handleAssign}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
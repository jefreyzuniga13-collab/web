import React, { useEffect, useState } from 'react';
import type{ AgentDto } from '@/Interfaces/Chat/ChatInterfaces';
import { getAgents, assignAgent } from '@/Utils/ApiConfig';

interface Props {
  convId?:   number;
  isOpen:   boolean;
  onClose:  () => void;
}

export const AssignModal: React.FC<Props> = ({
  convId,
  isOpen,
  onClose
}) => {
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [sel, setSel]       = useState<string>('');

  useEffect(() => {
    getAgents().then(res => setAgents(res.data.data)).catch(console.error);
  }, []);

  const handleAssign = () => {
    if (convId && sel) {
      assignAgent(convId, sel, 'Open').then(onClose).catch(console.error);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96">
        <h2 className="mb-2 text-lg">Asignar agente</h2>
        <select
          className="w-full p-2 border rounded"
          value={sel}
          onChange={e => setSel(e.target.value)}
        >
          <option value="">— Selecciona —</option>
          {agents.map(a => (
            <option key={a.userId} value={a.userId}>
              {a.fullName}
            </option>
          ))}
        </select>
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
            onClick={handleAssign}
            disabled={!sel}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
};

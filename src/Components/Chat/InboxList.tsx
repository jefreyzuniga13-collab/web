import React from 'react';
import { useConversations } from '@/Hooks/useConversations';

interface Props {
  selectedId?: number;
  onSelect:  (id: number) => void;
}

export const InboxList: React.FC<Props> = ({ selectedId, onSelect }) => {
  const convs = useConversations();
  return (
    <ul className="divide-y">
      {convs.map(c => (
        <li
          key={c.conversationId}
          className={`p-2 cursor-pointer ${
            c.conversationId === selectedId ? 'bg-gray-200' : ''
          }`}
          onClick={() => onSelect(c.conversationId)}
        >
          <div className="font-medium">{c.contactName}</div>
          <div className="text-sm text-gray-500">{c.status}</div>
        </li>
      ))}
    </ul>
  );
};

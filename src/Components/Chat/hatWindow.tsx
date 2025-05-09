import React, { useState, type ChangeEvent } from 'react';
import { useMessages } from '@/Hooks/useMessages';
import { sendText, sendFile } from '@/Utils/ApiConfig';

interface Props {
  conversationId?: number;
  userId:         string;
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId }) => {
  const messages = useMessages(conversationId);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSend = () => {
    if (!conversationId) return;
    if (file) {
      sendFile(conversationId, userId, file).then(() => setFile(null));
    } else if (text.trim()) {
      sendText(conversationId, userId, text).then(() => setText(''));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map(m => (
          <div key={m.messageId} className="border rounded p-2">
            {m.messageType === 'Media' && m.attachments.length > 0 ? (
              <img
                src={`https://graph.facebook.com/v16.0/${process.env.REACT_APP_PHONE_NUMBER_ID}/media/${m.attachments[0].mediaId}`}
                alt={m.caption}
                className="max-w-xs"
              />
            ) : (
              <span>{m.content}</span>
            )}
          </div>
        ))}
      </div>

      <div className="p-2 border-t flex space-x-2 items-center">
        <input
          type="text"
          className="flex-1 border rounded p-1"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <input type="file" onChange={handleFileChange} />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleSend}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};
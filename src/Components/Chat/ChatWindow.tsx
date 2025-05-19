
import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
import useMessages from '@/Hooks/useMessages';
import { sendText, sendMediaMessage } from '@/Utils/ApiConfig';
import { Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import '@/Styles/Chat/ChatWindow.css';
import { MessageSquareMore } from 'lucide-react';
import type { SentMessage } from '@/Interfaces/Chat/ChatInterfaces';

interface Props {
  conversationId?: number;
  userId: number;
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId }) => {
  const messages = useMessages(conversationId);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!conversationId || sending) return;
    setSending(true);
    try {
      if (file) {
        // Usar directamente sendMediaMessage
        await sendMediaMessage(
          conversationId,
          file,
          text.trim() || undefined
        );
        setFile(null);
        setText('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else if (text.trim()) {
        const message: SentMessage = {
          conversationId: conversationId,
          senderId: userId,
          content: text.trim(),
          messageType: 'Text'
        };
        await sendText(message);
        setText('');
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMessageStatusIcon = (message: any, isOut: boolean) => {
    if (!isOut) return null;
    
    if (message.readAt) {
      return (
        <span className="message-status message-status--read">
          <CheckCheck size={14} />
        </span>
      );
    } else if (message.deliveredAt) {
      return (
        <span className="message-status message-status--delivered">
          <CheckCheck size={14} />
        </span>
      );
    } else if (message.status === 'Sent') {
      return (
        <span className="message-status message-status--sent">
          <Check size={14} />
        </span>
      );
    }
    
    return null;
  };

  if (!conversationId) {
    return (
      <div className="chat-empty-state">
        <div className="empty-icon">
          <MessageSquareMore size={64} />
        </div>
        <h3 className="empty-title">Ninguna conversación seleccionada</h3>
        <p className="empty-text">
          Selecciona una conversación para chatear.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length > 0 && (
          <div className="messages-date-divider">Hoy</div>
        )}

        {messages.map((m, i) => {
          const isOut = m.senderId === userId;
          const side = isOut ? 'out' : 'in';
          const prev = i > 0 ? messages[i - 1] : null;
          const showSender = !prev || prev.senderId !== m.senderId;

          return (
            <div
              key={m.messageId}
              className={`message-group message-group--${side}`}
            >
              {showSender && !isOut && (
                <div className="message-sender">
                  {m.senderName || 'Usuario'}
                </div>
              )}
              <div
                className={`chat-window__message chat-window__message--${side}`}
              >
                {m.messageType === 'Media' && m.attachments?.length ? (
                  <img
                    // Usar mediaUrl si está disponible, o construir la URL con mediaId
                    src={m.attachments[0].mediaUrl || `${import.meta.env.VITE_API_URL}/Attachments/${m.attachments[0].mediaId}`}
                    alt={m.caption || ''}
                    className="chat-window__image"
                  />
                ) : (
                  <p className="chat-window__text">{m.content}</p>
                )}
                <div className="message-info">
                  {getMessageStatusIcon(m, isOut)}
                  <span className={`message-time message-time--${side}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              
              {m.readAt && isOut && (
                <div className="message-read-status">Leído</div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-window__composer">
        <div className="composer-attachment">
          <label htmlFor="file-upload" className="attachment-button">
            <Paperclip size={20} />
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="file-input-hidden"
            onChange={handleFileChange}
            disabled={!conversationId || sending}
          />
        </div>
        
        <div className="chat-window__input-wrap">
          <input
            type="text"
            className="chat-window__input"
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!conversationId || sending}
          />
        </div>
        
        <button
          className="chat-window__send"
          onClick={handleSend}
          disabled={!conversationId || sending || (!text.trim() && !file)}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
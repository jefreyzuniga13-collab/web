
  import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
  import  useMessages  from '@/Hooks/useMessages';
  import { sendText, uploadAttachment, sendMedia } from '@/Utils/ApiConfig';
  import { Send, Paperclip } from 'lucide-react';
  import '@/Styles/Chat/ChatWindow.css';

  interface Props {
    conversationId?: number;
    userId: string;
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

      try {
        setSending(true);

        if (file) {
          // Subir archivo y enviarlo
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await uploadAttachment(formData);
          const mediaId = uploadResponse.data.data as string;
          
          await sendMedia(
            conversationId, 
            userId, 
            mediaId, 
            file.type, 
            text.trim() || undefined
          );
          
          setFile(null);
          setText('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else if (text.trim()) {
          // Envío de texto
          await sendText(conversationId, userId, text.trim());
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

    if (!conversationId) {
      return (
        <div className="chat-empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
              <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"/>
            </svg>
          </div>
          <h3 className="empty-title">Ninguna conversación seleccionada</h3>
          <p className="empty-text">
            Selecciona una conversación de la lista para comenzar a chatear.
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

          {messages.map((m, index) => {
            const isOut = m.senderId === userId;
            const side = isOut ? 'out' : 'in';
            const prev = index > 0 ? messages[index - 1] : null;
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
                      src={`${import.meta.env.VITE_API_URL}/Attachments/${m.attachments[0].mediaId}`}
                      alt={m.caption || ''}
                      className="chat-window__image"
                    />
                  ) : (
                    <p className="chat-window__text">{m.content}</p>
                  )}
                </div>
                <div className={`message-time message-time--${side}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
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
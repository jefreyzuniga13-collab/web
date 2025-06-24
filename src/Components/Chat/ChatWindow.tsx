import React, { useEffect } from 'react'
import { Send, Paperclip, Download, MessageSquareMore } from 'lucide-react'
import '@/styles/Chat/ChatWindow.css'
import { useChatWindow } from '@/Hooks/Chat/useChatWindow'
//import { IoMdResize } from 'react-icons/io'

interface Props {
  conversationId?: number
  userId: number
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId }) => {
  const {
    setConversationId,
    setUserId,
    messages,
    text,
    setText,
    file,
    setFile,
    sending,
    handleSend,
    bottomRef,
    fileInputRef,
    handleFileChange,
    handlePaste,
    handleKeyPress,
    handleDownload,
    getStatusIcon,
    getMessageClassName,
    getMessagePosition,
    getFileIcon,
    ismaximize,
    previewImageUrl,
    openImagePreview,
    closeImagePreview,
  } = useChatWindow()

  useEffect(() => {
    setConversationId(Number(conversationId))
    setUserId(Number(userId))

    return () => {
      setConversationId(0)
      setUserId(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  if (!conversationId) {
    return (
      <div className="chat-window__empty">
        <div className="chat-window__empty-icon">
          <MessageSquareMore size={64} />
        </div>
        <h3 className="chat-window__empty-title">Ninguna conversación seleccionada</h3>
        <p className="chat-window__empty-text">Selecciona una conversación para chatear.</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length > 0 && (
          <div className="chat-window__date-divider">
            <span className="chat-window__date-text">Hoy</span>
          </div>
        )}

        {messages.map((m, i) => {
          const isCurrentUser = m.senderUserId === userId
          const prev = i > 0 ? messages[i - 1] : null
          const showSender = !prev || prev.senderUserId !== m.senderUserId

          return (
            <div key={m.messageId} className={getMessagePosition(m)}>
              {showSender && !isCurrentUser && (
                <div className="chat-window__message-sender">
                  {m.senderContactId ? m.senderContactName || 'Cliente' : m.senderUserName || 'Sistema'}
                </div>
              )}

              <div className={getMessageClassName(m)}>
                <div className="chat-window__message-content">
                  {m.attachments?.length ? (
                    <div className="chat-window__media">
                      {(m.attachments[0].mimeType?.startsWith('image/') ||
                        m.attachments[0].mimeType === 'image/webp') && (
                        <div className="chat-window__media-image">
                          <div className="chat-window__image-container">
                            <button
                              className="chat-window__download-btn"
                              onClick={() =>
                                handleDownload(m.attachments![0].mediaUrl!)
                              }
                              aria-label="Descargar imagen"
                            >
                              <Download size={16} />
                            </button>
                            <img
                              src={m.attachments[0].mediaUrl}
                              alt={m.attachments[0].fileName || 'Imagen'}
                              className="chat-window__image"
                              loading="lazy"
                              onClick={() => openImagePreview(m.attachments[0].mediaUrl!)}
                            />
                            {/* <div className="chat-window-container">
                              <button
                                className={`chat-window__maximize-btn ${ismaximize ? 'maximize' : ''}`}
                                onClick={() => openImagePreview(m.attachments[0].mediaUrl!)}
                                aria-label="maximizar"
                              >
                                <IoMdResize size={18} />
                              </button>
                            </div> */}
                          </div>
                        </div>
                      )}

                      {m.attachments[0].mimeType?.startsWith('video/') && (
                        <div className="chat-window__media-video">
                          <video controls className="chat-window__video" src={m.attachments[0].mediaUrl}>
                            Tu navegador no soporta el elemento video.
                          </video>
                        </div>
                      )}

                      {m.attachments[0].mimeType?.startsWith('audio/') && (
                        <div className="chat-window__media-audio">
                          <div className="chat-window__audio-container">
                            <div className="chat-window__audio-icon">🎵</div>
                            <div className="chat-window__audio-info">
                              <div className="chat-window__audio-name">{m.attachments[0].fileName || 'Audio'}</div>
                              <audio controls className="chat-window__audio-player" src={m.attachments[0].mediaUrl}>
                                Tu navegador no soporta el elemento audio.
                              </audio>
                            </div>
                          </div>
                        </div>
                      )}

                      {m.messageType === 'Document' && (
                        <div className="chat-window__media-document">
                          <a
                            href={m.attachments[0].mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-window__document-link"
                          >
                            <div className="chat-window__document-icon">
                              {getFileIcon(m.attachments[0].mimeType || '')}
                            </div>
                            <div className="chat-window__document-info">
                              <div className="chat-window__document-name">
                                {m.attachments[0].fileName || 'Documento'}
                              </div>
                              <div className="chat-window__document-size">{m.attachments[0].mimeType || 'Archivo'}</div>
                            </div>
                            <div className="chat-window__document-download">
                              <Download size={16} />
                            </div>
                          </a>
                        </div>
                      )}

                      {m.content && (
                        <div className="chat-window__message-caption">{m.content}</div>
                      )}
                    </div>
                  ) : (
                    <div className="chat-window__message-text">{m.content}</div>
                  )}
                </div>

                <div className="chat-window__message-info">
                  <span className="chat-window__message-time">
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {getStatusIcon(m, isCurrentUser)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-window__composer">
        <label htmlFor="file-upload" className="chat-window__composer-attachment" aria-label="Adjuntar archivo">
          <Paperclip size={20} />
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="chat-window__composer-file-input"
          onChange={handleFileChange}
          disabled={!conversationId || sending}
        />

        {file && (
          <div className="chat-window__composer-file-preview">
            <span className="chat-window__composer-file-name">{file.name}</span>
            <button
              className="chat-window__composer-file-remove"
              onClick={() => setFile(null)}
              aria-label="Eliminar archivo"
            >
              ×
            </button>
          </div>
        )}

        <div className="chat-window__composer-input-container">
          <textarea
            className="chat-window__composer-input"
            placeholder="Escribe un mensaje…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            disabled={!conversationId || sending}
            rows={1}
          />
        </div>

        <button
          className="chat-window__composer-send"
          onClick={handleSend}
          disabled={!conversationId || sending || (!text.trim() && !file)}
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Overlay para imagen maximizada */}
      {ismaximize && previewImageUrl && (
        <div className="chat-window__image-preview-overlay" onClick={closeImagePreview}>
          <img src={previewImageUrl} alt="Vista previa" className="chat-window__image-preview-full" />
        </div>
      )}
    </div>
  )
}

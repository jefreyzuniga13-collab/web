import React, { useEffect, useState, useRef, type ChangeEvent } from 'react'
import useMessages from '@/Hooks/useMessages'
import { sendText, sendMedia } from '@/Services/MessageService'
import { Send, Paperclip, Check, CheckCheck, MessageSquareMore } from 'lucide-react'
import type { MessageDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/ChatWindow.css'

interface Props {
  conversationId?: number
  userId: number
}

export const ChatWindow: React.FC<Props> = ({ conversationId, userId }) => {
  const messages = useMessages(conversationId)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleSend = async () => {
    if (!conversationId || sending) return
    setSending(true)
    try {
      if (file) {
        await sendMedia(conversationId, userId, file, text.trim() || undefined)
        setFile(null)
        setText('')
        fileInputRef.current!.value = ''
      } else if (text.trim()) {
        await sendText({
          conversationId,
          senderId: userId,
          content: text.trim(),
          messageType: 'Text'
        })
        setText('')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getStatusIcon = (m: MessageDto, isOut: boolean) => {
    if (!isOut) return null
    if (m.readAt) return <CheckCheck size={14} className="message-status message-status--read" />
    if (m.deliveredAt) return <CheckCheck size={14} className="message-status message-status--delivered" />
    if (m.status === 'Sent') return <Check size={14} className="message-status message-status--sent" />
    return null
  }

  if (!conversationId) {
    return (
      <div className="chat-empty-state">
        <div className="empty-icon"><MessageSquareMore size={64} /></div>
        <h3 className="empty-title">Ninguna conversación seleccionada</h3>
        <p className="empty-text">Selecciona una conversación para chatear.</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length > 0 && <div className="messages-date-divider">Hoy</div>}
        {messages.map((m, i) => {
          //Actualizar, hay 3 positivilidades.
          //1. Si el es un mensaje de cliente la propiedad de senderContactId tendra un valor, mientra que senderUserId sera null (Los mensajes deven de ser blancos, y poner en cada mensaje el SenderContactName)
          //2. Si la propiedad senderUserId tiene un valor distinto a userId, obtener y poner el SenderUserName y los mensajes en color de fondo verde.
          //3. Si senderUserId y userId son iguales, el color de fondo deve de ser auzul, y poner tambien el SenderUserName. Estos mensajes deve de estar a la derecha dado que son del usuario qe esta usando la web. Mientras que en el caso 1 y 2 deven de estar a la derecha y cada uo con un color de fondo distinto.
          // Esto brinda una mayor separacion y distincion entre los mensajes lo cual es util, para mostrar una mejor expericia a los usuarios.
          const isOut = m.senderUserId === userId 
          const side = isOut ? 'out' : 'in'
          
          const prev = i > 0 ? messages[i - 1] : null
          const showSender = !prev || prev.senderUserId !== m.senderUserId
          return (
            <div key={m.messageId} className={`message-group message-group--${side}`}>
              {showSender && !isOut && (
                <div className="message-sender">
                  {m.senderContactId ? m.SenderContactName || 'Cliente' : m.SenderUserName || 'Sistema'}
                </div>
              )}
              
              <div className={`chat-window__message chat-window__message--${side}`}>
                {m.messageType === 'Media' && m.attachments?.length ? (
                  <img
                    src={m.attachments[0].mediaUrl}
                    // alt={m.caption || ''}
                    className="chat-window__image"
                  />
                ) : (
                  <p className="chat-window__text">{m.content}</p>
                )}
                <div className="message-info">
                  {getStatusIcon(m, isOut)}
                  <span className={`message-time message-time--${side}`}>
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-window__composer">
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
  )
}
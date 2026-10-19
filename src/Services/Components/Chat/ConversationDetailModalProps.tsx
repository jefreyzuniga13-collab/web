import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import type { ConversationDto, 
  // MessageDto, AttachmentDto 
} from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/ConversationDetailModal.css'
import type { StateTranslation } from '@/Interfaces/Common/GlobalInterface'
import { stateTranslations } from '@/Utils/Translation/stateTranslations'
import { format } from 'date-fns'

interface ConversationDetailModalProps {
  isOpen: boolean
  data: ConversationDto | null
  onClose: () => void
}

    const formatDate = (iso?: string) => {
        if (!iso) return ''
        try {
          return format(new Date(iso), 'yyyy-MM-dd HH:mm')
        } catch {
          return ''
        }
  }

//   const formatTime = (iso?: string) => {
//   if (!iso) return ''
//   const match = iso.match(/T(\d{2}:\d{2})/)
//   return match ? match[1] : ''
// }

export default function ConversationDetailModal({ isOpen, data, onClose }: ConversationDetailModalProps) {
  if (!isOpen || !data) return null

  return (
    <div className="conversation-modal__overlay" onClick={onClose}>
      <div className="conversation-modal__container">
        <header className="conversation-modal__header">
          <h2 className="conversation-modal__title">Detalle de Conversación</h2>
          <IconButton size="small" className="conversation-modal__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </header>

        <section className="conversation-modal__section conversation-modal__section--info">
          <h3 className="conversation-modal__section-title">Información General</h3>
          <div className="conversation-modal__grid">
            <div className="conversation-modal__cell">
              <span className="conversation-modal__label">Numero</span>
              <span className="conversation-modal__value">{data.contactNumber}</span>
            </div>
            <div className="conversation-modal__cell">
              <span className="conversation-modal__label">Contacto</span>
              <span className="conversation-modal__value">{data.clientContactName || '-'}</span>
            </div>
            <div className="conversation-modal__cell">
              <span className="conversation-modal__label">Estado</span>
              <span className="conversation-modal__value"> {stateTranslations[data.status as StateTranslation]}</span>
            </div>
          </div>
        </section>

        <section className="conversation-modal__section conversation-modal__section--timeline">
          <h3 className="conversation-modal__section-title">Línea de Tiempo</h3>
          <div className="conversation-modal__grid">
            {[
              ['Creado', data.createdAt],
              ['Cliente primer menasaje', data.clientFirstMessage],
              ['Último mensaje cliente', data.clientLastMessageAt],
              ['Solicitud asignación cliente', data.agentRequestAt],
              ['Solicitud asignación admin', data.requestedAgentAt],
              ['Aceptación asignación del admin', data.assignedAt],
              ['Primer mensaje agente', data.agentFirstMessageAt],
              ['Último mensaje agente', data.agentLastMessageAt],
              ['Cerrado', data.closedAt],
              ['Incompleto', data.incompletedAt],
               ['Última actividad', data.lastActivity],
            ].map(([label, value]) => (
              <div key={label} className="conversation-modal__cell">
                <span className="conversation-modal__label">{label}</span>
                <span className="conversation-modal__value">{formatDate(value as string)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* {data.messages && (
          <section className="conversation-modal__section conversation-modal__section--messages">
            <h3 className="conversation-modal__section-title">Mensajes</h3>
            <ul className="conversation-modal__messages">
              {data.messages.map((msg: MessageDto) => (
                <li key={msg.messageId} className="conversation-modal__message">
                  <div className="conversation-modal__message-header">
                    <span className="conversation-modal__message-sender">
                      {msg.isIncoming ? msg.senderContactName || 'Contacto' : msg.senderUserName || 'Agente'}
                    </span>
                    <span className="conversation-modal__message-time">
                      {formatTime(msg.sentAt)}
                    </span>
                  </div>
                  <div className="conversation-modal__message-content">
                    {msg.content || `[${msg.messageType}]`}
                  </div>
                  {msg.attachments.length > 0 && (
                    <ul className="conversation-modal__attachments">
                      {msg.attachments.map((att: AttachmentDto) => (
                        <li key={att.attachmentId} className="conversation-modal__attachment">
                          <a href={att.mediaUrl} target="_blank" rel="noopener noreferrer">
                            {att.fileName || att.mediaId}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )} */}
      </div>
    </div>
  )
}
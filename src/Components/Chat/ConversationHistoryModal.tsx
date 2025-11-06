/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, X, Loader2, Download } from "lucide-react";
import { useConversationHistoryModal } from "@/Hooks/Chat/useConversationHistoryModal";
import useContact from "@/Hooks/Contact/useContact";
import bg from "@/assets/backgroundchat.png";
import "@/Styles/Chat/ConversationHistoryModal.css";

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  clientId: string | null;
  conversationStart: string | null
}

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
};



const isImage = (mt?: string | null) => !!mt && (mt.startsWith("image/") || mt === "image/webp");
const isVideo = (mt?: string | null) => !!mt && mt.startsWith("video/");
const isAudio = (mt?: string | null) => !!mt && mt.startsWith("audio/");

const renderAttachments = (message: any) => {
  const a = message?.attachments?.[0];
  if (!a) return null;
  const href = a.mediaUrl as string;
  const name = (a.fileName as string) || "archivo";
  if (isImage(a.mimeType)) {
    return (
      <div className="chm-attachment chm-attachment--image">
        <a href={href} target="_blank" rel="noopener noreferrer" className="chm-image-link">
          <img src={href} alt={name} className="chm-image" loading="lazy" />
        </a>
        <div className="chm-attachment-meta">
          <a href={href} download={name} className="chm-download">
            <Download size={14} />
            <span>{name}</span>
          </a>
        </div>
      </div>
    );
  }

  if (isVideo(a.mimeType)) {
    return (
      <div className="chm-attachment chm-attachment--video">
        <video controls className="chm-video" src={href} />
        <div className="chm-attachment-meta">
          <a href={href} download={name} className="chm-download">
            <Download size={14} />
            <span>{name}</span>
          </a>
        </div>
      </div>
    );
  }

  if (isAudio(a.mimeType)) {
    return (
      <div className="chm-attachment chm-attachment--audio">
        <audio controls className="chm-audio" src={href} />
        <div className="chm-attachment-meta">
          <a href={href} download={name} className="chm-download">
            <Download size={14} />
            <span>{name}</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="chm-attachment chm-attachment--doc">
      <a href={href} target="_blank" rel="noopener noreferrer" className="chm-doc-link">
        <span className="chm-doc-name">{name}</span>
      </a>
      <div className="chm-attachment-meta">
        <a href={href} download={name} className="chm-download">
          <Download size={14} />
          <span>Descargar</span>
        </a>
      </div>
    </div>
  );
};

const ConversationHistoryModal: React.FC<ConversationHistoryModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  clientId,
  conversationStart
}) => {
  const {
    setEndDate,
    goToNextMatch,
    setStartDate,
    goToPreviousMatch,
    handleKeyDown,
    setSearchTerm,
    highlightText,
    endDate,
    startDate,
    currentMatch,
    totalMatches,
    searchTerm,
    loading: historyLoading,
    allMessages,
    messageRefs,
  } = useConversationHistoryModal(isOpen, 
    conversationId, 
    conversationStart);

  const { getByClient, data: contacts, loading: contactsLoading, error: contactsError } = useContact();

  useEffect(() => {
    if (isOpen && clientId) getByClient(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientId]);

  const sortedMessages = useMemo(() => {
    return [...allMessages].sort((a: any, b: any) => (a.sentAt < b.sentAt ? -1 : 1));
  }, [allMessages]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chm-container chm-lg" onClick={(e) => e.stopPropagation()}>
        <div className="chm-header">
          <h2 className="chm-title">Historial de Conversaciones</h2>
          <button className="chm-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="chm-body">
          <aside className="chm-contacts">
            <div className="chm-contacts-header">Contactos</div>
            <div className="chm-contacts-list">
              {contactsLoading && <div className="chm-contacts-loading">Cargando…</div>}
              {contactsError && <div className="chm-contacts-error">Error al cargar</div>}
              {!contactsLoading && !contactsError && contacts?.length === 0 && (
                <div className="chm-contacts-empty">Sin contactos</div>
              )}
              {contacts?.map((c: any, idx: number) => (
                <button key={idx} type="button" className="chm-contact-item">
                  <div className="chm-contact-name">{c.fullName || c.waName || "Contacto"}</div>
                  <div className="chm-contact-meta">{c.phone || c.waPhone || ""}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="chm-content">
            <div className="chm-toolbar">
              <div className="chm-search">
                <div className="chm-search-input">
                  <Search size={16} className="chm-search-icon" />
                  <input
                    className="chm-input"
                    placeholder="Buscar en mensajes…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {totalMatches > 0 && (
                  <div className="chm-search-nav">
                    <span className="chm-search-count">{currentMatch + 1} de {totalMatches}</span>
                    <button className="chm-icon-btn" onClick={goToPreviousMatch} disabled={totalMatches === 0}>
                      <ChevronUp size={16} />
                    </button>
                    <button className="chm-icon-btn" onClick={goToNextMatch} disabled={totalMatches === 0}>
                      <ChevronDown size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="chm-dates">
                
                {/* Este input no toma ese valor que le pasa como ves en la imagen */}
                <input
                  type="date"
                  className="chm-date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <input
                  type="date"
                  className="chm-date"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="chm-messages" style={{ backgroundImage: `url(${bg})` }}>
              {historyLoading ? (
                <div className="chm-loading">
                  <Loader2 size={32} className="chm-spinner" />
                  <span>Cargando historial…</span>
                </div>
              ) : sortedMessages.length > 0 ? (
                <div className="chm-list">
                  {sortedMessages.map((m: any, index: number) => {
                    const isIncoming = !!m.senderContactId;
                    return (
                      <div
                        key={`${m.messageId}-${index}`}
                        ref={(el) => {
                          messageRefs.current[index] = el as HTMLDivElement | null;
                        }}
                        className={`chm-item ${isIncoming ? "chm-item--in" : "chm-item--out"}`}
                      >
                        <div className="chm-box">
                        <div className="chm-item-header">
                          <div className="chm-avatar">{isIncoming ? "C" : "A"}</div>
                          <div className="chm-meta">
                            <span className="chm-sender">{isIncoming ? m.senderContactName || "Cliente" : m.senderUserName || "Agente"}</span>
                            <span className="chm-time">{formatTime(m.sentAt)}</span>
                          </div>
                        </div>
                        <div className="chm-item-body">
                          {m.content ? (
                            <span className="chm-text">{highlightText(m.content, searchTerm)}</span>
                          ) : (
                            <span className="chm-text--muted">{m.messageType === "Media" ? "Archivo multimedia" : "Mensaje sin contenido"}</span>
                          )}
                          {m.attachments?.length > 0 && <div className="chm-attachments">{renderAttachments(m)}</div>}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="chm-empty">No se encontraron conversaciones en ese rango de fechas</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryModal;
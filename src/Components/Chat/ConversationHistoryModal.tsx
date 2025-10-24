import React from "react";
import { Search, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import "@/Styles/Chat/ConversationHistoryModal.css";
import { useConversationHistoryModal } from "@/Hooks/Chat/useConversationHistoryModal";

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
}

// Modal de muestra del historial de una conversación.
export const ConversationHistoryModal: React.FC<
  ConversationHistoryModalProps
> = ({ isOpen, onClose, conversationId }) => {

  const {
    generateSummary,
    setEndDate,
    goToNextMatch,
    setStartDate,
    goToPreviousMatch,
    handleKeyDown,
    setSearchTerm,
    highlightText,
    setShowSummary,
    summary,
    showSummary,
    loadingSummary,
    endDate,
    startDate,
    currentMatch,
    totalMatches,
    searchTerm,
    // filteredMessages,
    loading,
    allMessages,
    messageRefs,
  } = useConversationHistoryModal(isOpen, conversationId);
  if (!isOpen) return null;
    
       const formatTime = (iso?: string) => {
      if (!iso) return ''
      const match = iso.match(/T(\d{2}:\d{2})/)
      return match ? match[1] : ''
    }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Historial de Conversaciones</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="history-controls">

            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Buscar en mensajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {totalMatches > 0 && (
                <div className="search-results">
                  <span className="search-count">
                    {currentMatch + 1} de {totalMatches}
                  </span>
                  <button
                    className="search-nav-btn"
                    onClick={goToPreviousMatch}
                    disabled={totalMatches === 0}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    className="search-nav-btn"
                    onClick={goToNextMatch}
                    disabled={totalMatches === 0}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* ======= Contenedor de fechas ======= */}
            <div className="model-content date-container">
              <input
                type="date"
                className="date-input"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min="01/01/2024"
                max="01/01/2040"
              />
              <input
                type="date"
                className="date-input"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min="01/01/2024"
                max="01/01/2040"
              />
            </div>

  
            <button
              className="summary-btn"
              onClick={generateSummary}
              disabled={loadingSummary || allMessages.length === 0}
            >
              {loadingSummary ? (
                <Loader2 size={16} className="loading-spinner" />
              ) : (
                <span>📄</span>
              )}
              Resumen
            </button>
          </div>

          {showSummary && summary && (
            <div className="summary-panel">
              <div className="summary-header">
                <h4 className="summary-title">Resumen de las conversaciones</h4>
                <button
                  className="summary-close"
                  onClick={() => setShowSummary(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <p className="summary-content">{summary}</p>
            </div>
          )}

          <div className="messages-container">
            {loading ? (
              <div className="loading-state">
                <Loader2 size={32} className="loading-spinner" />
                <span>Cargando historial...</span>
              </div>
            ) : allMessages.length > 0 ? (
              <div className="messages-list">
                {allMessages.map((message, index) => (
                  <div
                    key={`${message.messageId}-${index}`}
                    ref={(el) => {
                      messageRefs.current[index] = el;
                    }}
                    className="message-item"
                  >
                    <div className="message-header">
                      <div className="sender-avatar">
                        {message.senderContactId ? "C" : "A"}
                      </div>
                      <div className="message-meta">
                        <span className="sender-name">
                          {message.senderContactId
                            ? message.senderContactName || "Cliente"
                            : message.senderUserName || "Agente"}
                        </span>
                        <span className="message-time">
                          {formatTime(message.sentAt)}
                        </span>
                      </div>
                    </div>
                    <div className="message-content">
                      {message.content ? (
                        <span>
                          {highlightText(message.content, searchTerm)}
                        </span>
                      ) : (
                        <span className="no-content">
                          {message.messageType === "Media"
                            ? "Archivo multimedia"
                            : "Mensaje sin contenido"}
                        </span>
                      )}
                    </div>
                    {message.attachments?.length > 0 && (
                      <div className="attachments-info">
                        📎 {message.attachments.length} archivo(s) adjunto(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="error-state">
                No se encontraron conversaciones en ese rango de fechas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
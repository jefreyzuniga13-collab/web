import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { getHistoryByContact as getConversationHistory, summarizeAllByContact as generateConversationSummary } from '@/Services/ConversationService';
import type { ConversationHistoryDto, MessageWithAttachmentsDto } from '@/Interfaces/Chat/ChatInterfaces';
import '@/Styles/Chat/ConversationHistoryModal.css';

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
}

export const ConversationHistoryModal: React.FC<ConversationHistoryModalProps> = ({
  isOpen,
  onClose,
  conversationId
}) => {
  const [conversations, setConversations] = useState<ConversationHistoryDto[]>([]);
  const [allMessages, setAllMessages] = useState<MessageWithAttachmentsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

console.log(conversations)
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  // --------------------------------------------------------------

  const fetchHistory = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await getConversationHistory(conversationId);
      const result = response.data?.data;

      if (Array.isArray(result)) {
        setConversations(result);
        const messages = result.flatMap(conv => conv.messages);
        messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        setAllMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const generateSummary = useCallback(async () => {
    if (!conversationId) return;

    setLoadingSummary(true);
    try {
      const response = await generateConversationSummary(conversationId);
      setSummary(response.data.data);
      setShowSummary(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, [conversationId]);

  // Cuando el modal se abra, traemos el historial. Si se cierra, reiniciamos todo.
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    } else {
      setConversations([]);
      setAllMessages([]);
      setSearchTerm('');
      setCurrentMatch(0);
      setTotalMatches(0);
      setSummary(null);
      setShowSummary(false);
      // Reiniciar fechas opcional; si quieres que permanezcan, coméntalo:
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, fetchHistory]);

  // ------------------ FILTRADO POR RANGO DE FECHAS ------------------
  const filteredMessages = useMemo(() => {
    if (!allMessages.length) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return allMessages.filter((message) => {
      const msgDate = new Date(message.sentAt);
      return msgDate >= start && msgDate <= end;
    });
  }, [allMessages, startDate, endDate]);
  // ------------------------------------------------------------------

  // --------------------- BÚSQUEDA DE TEXTO ---------------------
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === term.toLowerCase()
        ? (
          <mark key={idx} className="search-highlight">
            {part}
          </mark>
        )
        : part
    );
  };

  const searchMessages = useCallback(() => {
    if (!filteredMessages.length || !searchTerm.trim()) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    const matches: number[] = [];
    filteredMessages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    setTotalMatches(matches.length);
    setCurrentMatch(matches.length > 0 ? 0 : -1);

    if (matches.length > 0) {
      const firstMatchIndex = matches[0];
      const element = messageRefs.current[firstMatchIndex];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [filteredMessages, searchTerm]);

  useEffect(() => {
    searchMessages();
  }, [searchMessages]);

  const goToNextMatch = () => {
    if (!filteredMessages.length || totalMatches === 0) return;

    const matches: number[] = [];
    filteredMessages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    const next = (currentMatch + 1) % totalMatches;
    setCurrentMatch(next);
    const element = messageRefs.current[matches[next]];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToPreviousMatch = () => {
    if (!filteredMessages.length || totalMatches === 0) return;

    const matches: number[] = [];
    filteredMessages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    const prev = currentMatch === 0 ? totalMatches - 1 : currentMatch - 1;
    setCurrentMatch(prev);
    const element = messageRefs.current[matches[prev]];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        goToPreviousMatch();
      } else {
        goToNextMatch();
      }
    }
  };
  // --------------------------------------------------------------

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Historial de Conversaciones</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="history-controls">
            {/* ======= Contenedor de búsqueda ======= */}
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
                  <span className="search-count">{currentMatch + 1} de {totalMatches}</span>
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
                max="01/01/2030"
              />
              <input
                type="date"
                className="date-input"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min="01/01/2024"
                max="01/01/2030"
              />
            </div>

            {/* ======= Botón de Resumen ======= */}
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
            ) : filteredMessages.length > 0 ? (
              <div className="messages-list">
                {filteredMessages.map((message, index) => (
                  <div
                    key={`${message.messageId}-${index}`}
                    ref={(el) => { messageRefs.current[index] = el; }}
                    className="message-item"
                  >
                    <div className="message-header">
                      <div className="sender-avatar">
                        {message.senderContactId ? 'C' : 'A'}
                      </div>
                      <div className="message-meta">
                        <span className="sender-name">
                          {message.senderContactId
                            ? message.senderContactName || 'Cliente'
                            : message.senderUserName || 'Agente'}
                        </span>
                        <span className="message-time">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="message-content">
                      {message.content ? (
                        <span>{highlightText(message.content, searchTerm)}</span>
                      ) : (
                        <span className="no-content">
                          {message.messageType === 'Media'
                            ? 'Archivo multimedia'
                            : 'Mensaje sin contenido'}
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

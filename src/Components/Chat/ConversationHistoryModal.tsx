/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { ConversationService } from "@/Services/chat/ConversationService";
import useContact from "@/Hooks/Auth/useContact";
import bg from "@/assets/img/backgroundchat.png";
import "@/Styles/Chat/ConversationHistoryModal.css";
import CustomLoader from '@/Components/Common/CustomLoader'
import { formatTime } from "@/Utils/ECommerce/formatters";
import { dateLabel, renderAttachments } from "@/Utils/Chat/Utils";

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  clientId: string | null;
  conversationStart: string | null;
  initialContactId?: number | null;
}

const ConversationHistoryModal: React.FC<ConversationHistoryModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  clientId,
  conversationStart,
  initialContactId
}) => {
  const {
    contactByClient: contacts,
    getByClientCode,
    loading: contactsLoading,
    error: contactsError
  } = useContact();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matchIds, setMatchIds] = useState<number[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [stickyDate, setStickyDate] = useState<string | null>(null);
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Calcular etiqueta de fecha fija según scroll
  const computeStickyDate = useCallback(() => {
    const root = listRef.current;
    if (!root) return;
    const y = root.scrollTop + 8;
    const entries = Object.entries(dateRefs.current)
      .filter(([, el]) => el)
      .sort((a, b) => a[1]!.offsetTop - b[1]!.offsetTop);

    let current: string | null = null;
    for (const [label, el] of entries) {
      if (el!.offsetTop <= y) current = label;
      else break;
    }
    if (!current && entries.length) current = entries[0][0];
    setStickyDate(current);
  }, []);

  // Resaltar coincidencias de búsqueda en texto
  const highlightText = useCallback((text: string, term: string) => {
    if (!term) return text;
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${safe})`, "ig");
    const parts = text.split(re);
    return parts.map((p, i) =>
      p.toLowerCase().includes(term.toLowerCase()) ? (
        <mark key={i} className="chm-mark">
          {p}
        </mark>
      ) : (
        <React.Fragment key={i}>{p}</React.Fragment>
      )
    );
  }, []);

  // Calcular ids de mensajes que coinciden con la búsqueda
  const updateMatches = useCallback(() => {
    const term = searchTerm.trim();
    if (!term) {
      setMatchIds([]);
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }
    const ids = messages
      .filter(
        m =>
          typeof m.content === "string" &&
          m.content.toLowerCase().includes(term.toLowerCase())
      )
      .map(m => m.messageId as number);
    setMatchIds(ids);
    setTotalMatches(ids.length);
    setCurrentMatch(0);
  }, [messages, searchTerm]);

  // Navegar entre coincidencias
  const gotoMatch = useCallback(
    (dir: number) => {
      if (!totalMatches) return;
      const idx = (currentMatch + dir + totalMatches) % totalMatches;
      setCurrentMatch(idx);
      const id = matchIds[idx];
      const pos = messages.findIndex(m => m.messageId === id);
      if (pos >= 0 && messageRefs.current[pos]) {
        messageRefs.current[pos]?.scrollIntoView({ block: "center" });
      }
    },
    [currentMatch, totalMatches, matchIds, messages]
  );

  // Ir al mensaje original de un reply
  const scrollToMessage = useCallback(
    (messageId?: number | null) => {
      if (!messageId) return;

      const idx = messages.findIndex(m => m.messageId === messageId);
      if (idx === -1) return;

      const el = messageRefs.current[idx];
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("chm-item--highlight");
      setTimeout(() => {
        el.classList.remove("chm-item--highlight");
      }, 1500);
    },
    [messages]
  );

  const toDate = (v?: string) => {
    if (!v) return undefined;
    return new Date(`${v}T00:00:00`);
  };

  // Obtener página de mensajes
  const fetchPage = useCallback(
    async (reset = false) => {
      if (!selectedIds.length) return;
      if (loading) return;

      setLoading(true);
      try {
        const pg = reset ? 1 : page;

        let fromDate = toDate(startDate || undefined);
        let toDateVal = toDate(endDate || undefined);

        // Intercambiar fechas si vienen invertidas
        if (fromDate && toDateVal && fromDate > toDateVal) {
          const tmp = fromDate;
          fromDate = toDateVal;
          toDateVal = tmp;
        }

        const res = await ConversationService.getByContacts(
          selectedIds,
          pg,
          pageSize,
          fromDate,
          toDateVal,
          searchTerm.trim() || undefined
        );

        const nextMessages = res.items.flatMap((c: any) =>
          (c.messages || []).map((m: any) => ({
            ...m,
            _convId: c.conversationId
          }))
        );

        setMessages(prev => {
          const merged = reset ? nextMessages : [...prev, ...nextMessages];
          return merged.sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1));
        });

        setHasMore(pg < (res.meta?.totalPages ?? 0));
        setPage(pg + 1);
      } catch {
        // ignorar
      } finally {
        setLoading(false);
      }
    },
    [selectedIds, page, pageSize, startDate, endDate, searchTerm, loading]
  );

  // Detectar scroll para infinite scroll y fecha fija
  const onScroll = useCallback(() => {
    const root = listRef.current;
    if (!root || loading || !hasMore) return;
    const nearBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 200;
    if (nearBottom) fetchPage(false);
    requestAnimationFrame(computeStickyDate);
  }, [loading, hasMore, fetchPage, computeStickyDate]);

  useEffect(() => {
    if (isOpen && clientId) getByClientCode(clientId);
  }, [isOpen, clientId, getByClientCode]);

  useEffect(() => {
    if (!isOpen) return;
    const d = conversationStart ?? "";
    setStartDate(d);
    setEndDate(d);
  }, [conversationId, conversationStart, isOpen]);

  useEffect(() => {
    if (contactsLoading || !contacts || !contacts.length) return;
    if (selectedIds.length > 0) return;

    let candidate: number | null = null;
    if (initialContactId && Number.isFinite(initialContactId)) {
      candidate = Number(initialContactId);
    } else {
      const c0: any = contacts[0];
      candidate = Number(
        c0?.clientContactId ?? c0?.id ?? c0?.contactId ?? 0
      );
    }

    if (candidate) setSelectedIds([candidate]);
  }, [contactsLoading, contacts, selectedIds.length, initialContactId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedIds.length) return;

    setPage(1);
    setHasMore(true);
    setMessages([]);
    dateRefs.current = {};
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedIds, startDate, endDate, searchTerm]);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    root.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(computeStickyDate);
    return () => root.removeEventListener("scroll", onScroll);
  }, [onScroll, computeStickyDate]);

  useEffect(() => {
    dateRefs.current = {};
    requestAnimationFrame(computeStickyDate);
  }, [messages.length, computeStickyDate]);

  useEffect(() => {
    updateMatches();
  }, [searchTerm, messages, updateMatches]);

  const sortedMessages = messages;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chm-container chm-lg" onClick={e => e.stopPropagation()}>
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
              {contactsLoading && (
                <div className="chm-contacts-loading">Cargando…</div>
              )}
              {contactsError && (
                <div className="chm-contacts-error">Error al cargar</div>
              )}
              {!contactsLoading &&
                !contactsError &&
                Array.isArray(contacts) &&
                contacts.length === 0 && (
                  <div className="chm-contacts-empty">Sin contactos</div>
                )}

              {Array.isArray(contacts) &&
                contacts.map((c: any, idx: number) => {
                  const id = Number(
                    c.clientContactId || c.id || c.contactId
                  );
                  const checked = selectedIds.includes(id);
                  return (
                    <label key={idx} className="chm-contact-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setMessages([]);
                          dateRefs.current = {};
                          if (checked)
                            setSelectedIds(
                              selectedIds.filter(x => x !== id)
                            );
                          else setSelectedIds([...selectedIds, id]);
                        }}
                      />
                      <div className="chm-contact-name">
                        {c.fullName || c.waName || "Contacto"}
                      </div>
                      <div className="chm-contact-meta">
                        {c.phone || c.waPhone || ""}
                      </div>
                    </label>
                  );
                })}
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
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") gotoMatch(1);
                    }}
                  />
                </div>
                {totalMatches > 0 && (
                  <div className="chm-search-nav">
                    <span className="chm-search-count">
                      {currentMatch + 1} de {totalMatches}
                    </span>
                    <button
                      className="chm-icon-btn"
                      onClick={() => gotoMatch(-1)}
                      disabled={totalMatches === 0}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="chm-icon-btn"
                      onClick={() => gotoMatch(1)}
                      disabled={totalMatches === 0}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="chm-dates">
                <input
                  type="date"
                  className="chm-date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="chm-date"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div
              className="chm-messages"
              style={{ backgroundImage: `url(${bg})` }}
              ref={listRef}
            >
              {loading && messages.length === 0 ? (
                <div className="chm-loading">
                  <Loader2 size={32} className="chm-spinner" />
                  <span>Cargando historial…</span>
                </div>
              ) : sortedMessages.length > 0 ? (
                <div className="chm-list">
                  {stickyDate && (
                    <div className="chat-window__sticky-date">
                      <span className="chat-window__date-text chat-window__date-text--dark">
                        {stickyDate}
                      </span>
                    </div>
                  )}

                  {sortedMessages.map((m: any, index: number) => {
                    const label = dateLabel(m.sentAt);
                    const prev = index > 0 ? sortedMessages[index - 1] : null;
                    const prevLabel = prev ? dateLabel(prev.sentAt) : null;
                    const showDivider = !prev || label !== prevLabel;
                    const isIncoming = !!m.senderContactId;

                    return (
                      <div key={`${m.messageId}-${index}`}>
                        {showDivider && (
                          <div
                            className="chat-window__date-divider"
                            ref={el => {
                              if (el) dateRefs.current[label] = el;
                            }}
                          >
                            <span className="chat-window__date-text chat-window__date-text--dark">
                              {label}
                            </span>
                          </div>
                        )}

                        <div
                          ref={el => {
                            messageRefs.current[index] =
                              el as HTMLDivElement | null;
                          }}
                          className={`chm-item ${
                            isIncoming ? "chm-item--in" : "chm-item--out"
                          }`}
                        >
                          <div className="chm-box">
                            <div className="chm-item-header">
                              <div className="chm-avatar">
                                {isIncoming ? "C" : "A"}
                              </div>
                              <div className="chm-meta">
                                <span className="chm-sender">
                                  {isIncoming
                                    ? m.senderContactName || "Cliente"
                                    : m.senderUserName || "Agente"}
                                </span>
                                <span className="chm-time">
                                  {formatTime(m.sentAt)}
                                </span>
                              </div>
                            </div>

                            <div className="chm-item-body">
                              {m.repliedMessage && (
                                <div
                                  className="chat-window__reply-preview"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() =>
                                    scrollToMessage(m.repliedMessageId)
                                  }
                                  onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      scrollToMessage(m.repliedMessageId);
                                    }
                                  }}
                                >
                                  <div className="chat-window__reply-author">
                                    {m.repliedMessage.senderContactId
                                      ? m.repliedMessage.senderContactName ||
                                        "Cliente"
                                      : m.repliedMessage.senderUserName ||
                                        "Sistema"}
                                  </div>
                                  <div className="chat-window__reply-content chat-window__reply-row">
                                    {m.repliedMessage.attachments?.length ? (
                                      (() => {
                                        const att =
                                          m.repliedMessage.attachments[0];
                                        const mime = att?.mimeType || "";
                                        if (
                                          mime.startsWith("image/") ||
                                          mime === "image/webp"
                                        ) {
                                          return (
                                            <div className="chat-window__reply-thumb">
                                              <img
                                                src={att.mediaUrl}
                                                alt={
                                                  att.fileName || "Imagen"
                                                }
                                                className="chat-window__reply-thumb-img"
                                                loading="lazy"
                                              />
                                              <span className="chat-window__reply-thumb-label">
                                                {att.fileName || "Imagen"}
                                              </span>
                                            </div>
                                          );
                                        }
                                        if (mime.startsWith("video/")) {
                                          return (
                                            <div className="chat-window__reply-thumb">
                                              <span>🎬</span>
                                              <span className="chat-window__reply-thumb-label">
                                                {att.fileName || "Video"}
                                              </span>
                                            </div>
                                          );
                                        }
                                        if (mime.startsWith("audio/")) {
                                          return (
                                            <div className="chat-window__reply-thumb">
                                              <span>🎵</span>
                                              <span className="chat-window__reply-thumb-label">
                                                {att.fileName || "Audio"}
                                              </span>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="chat-window__reply-thumb">
                                            <span>📄</span>
                                            <span className="chat-window__reply-thumb-label">
                                              {att.fileName ||
                                                att.mimeType ||
                                                "Adjunto"}
                                            </span>
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <span className="chat-window__reply-thumb-label">
                                        {m.repliedMessage.content
                                          ? m.repliedMessage.content.length >
                                            80
                                            ? m.repliedMessage.content.slice(
                                                0,
                                                80
                                              ) + "…"
                                            : m.repliedMessage.content
                                          : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {m.content ? (
                                <span className="chm-text">
                                  {highlightText(
                                    String(m.content),
                                    searchTerm
                                  )}
                                </span>
                              ) : (
                                <span className="chm-text--muted">
                                  {m.messageType === "Media"
                                    ? "Archivo multimedia"
                                    : "Mensaje sin contenido"}
                                </span>
                              )}

                              {m.attachments?.length > 0 && (
                                <div className="chm-attachments">
                                  {renderAttachments(m)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {loading && hasMore && (
                    <CustomLoader/>
                  )}

                  {!hasMore && (
                    <div className="chm-end">Fin del historial</div>
                  )}
                </div>
              ) : (
                <div className="chm-empty">
                  No se encontraron conversaciones en ese rango
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryModal;
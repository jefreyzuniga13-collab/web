/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Download, MessageSquareMore } from "lucide-react";
import { useChatWindow } from "@/Hooks/Chat/useChatWindow";
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
import { format, isToday, isYesterday, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale/es";
import SmsIcon from "@mui/icons-material/Sms";
import { useCustomMessage } from "@/Hooks/Chat/useCustomMesssage";
import { CustomMessagesFlyout } from "@/Components/Chat/CustomMessagesFlyout";
import "@/Styles/Chat/custom-messages-flyout.css"
import { FaArrowDown } from "react-icons/fa";
import "@/styles/Chat/ChatWindow.css";

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
};

interface Props {
  conversationId?: number;
  conversationStatus?: string | null;
  userId: number;
  selectedParam: SystemParamResponseDto | null;
  highlightTerm?: string 
}

export const ChatWindow: React.FC<Props> = ({
  conversationId,
  userId,
  conversationStatus,
  selectedParam,
  highlightTerm,
}) => {
   const smsBtnRef = useRef<HTMLDivElement | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
const [showScrollButton, setShowScrollButton] = useState(false);
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [stickyDate, setStickyDate] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement|null>(null);
  const composerRef = useRef<HTMLDivElement|null>(null);

  const {
    customMessages,
    create,
    update,
    toggleSystemParam,
    loading,
    error
  } = useCustomMessage();

  const {
    setConversationId,
    setUserId,
    visibleMessages,
    hasText,
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
    // handleKeyPress,
    getStatusIcon,
    getMessageClassName,
    getMessagePosition,
    getFileIcon,
    ismaximize,
    previewImageUrl,
    openImagePreview,
    closeImagePreview,
    setSelectedOption,
    beginReply,
    cancelReply,
    replyTo,
    // quickOptions,
    // sendQuick,
    startLongPress,
    cancelLongPress,
    focusTextarea,
    onComposerKeyDown,
    // popoverRef,
    textAreaRef,
    registerMessageRef,
    scrollToMessage,
    highlightedId,
    // visibleState,
    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    highlightText
  } = useChatWindow({
    conversationId,
    userId,
    conversationStatus,
    selectedParam,
    highlightTerm
  });

  useEffect(() => {
      setConversationId(Number(conversationId));
      setUserId(Number(userId));
      return () => {
        setConversationId(0);
        setUserId(0);
      };
    }, [conversationId, setConversationId, setUserId, userId]);

    const computeStickyDate = React.useCallback(() => {
    const root = messagesContainerRef.current;
    if (!root) return;
    const y = root.scrollTop + 8; // un pequeño margen

    // toma el último día cuyo separador ya pasó por arriba
    const entries = Object.entries(dateRefs.current)
      .filter(([, el]) => el)
      .sort((a, b) => (a[1]!.offsetTop - b[1]!.offsetTop));

    let current: string | null = null;
    for (const [label, el] of entries) {
      if (el!.offsetTop <= y) current = label;
      else break;
    }
    // si aún no pasó ninguno, muestra el primero
    if (!current && entries.length) current = entries[0][0];

    setStickyDate(current);
  }, []);

useEffect(() => {
  const root = messagesContainerRef.current;
  if (!root) return;
  const onScroll = () => computeStickyDate();
  root.addEventListener("scroll", onScroll, { passive: true });

  requestAnimationFrame(computeStickyDate);
  return () => root.removeEventListener("scroll", onScroll);
}, [computeStickyDate]);

// cuando cambie el listado, recalcúlalo
useEffect(() => {
  // limpia refs obsoletos
  dateRefs.current = {};
  requestAnimationFrame(computeStickyDate);
}, [visibleMessages.length, computeStickyDate]);

const isAtBottom = (el: HTMLElement) =>
  el.scrollTop >= el.scrollHeight - el.clientHeight - 12;

const handleSendNow = React.useCallback(async (txt: string) => {
  setSelectedOption(txt);
  await handleSend();
}, [setSelectedOption, handleSend]);


useEffect(() => {
  const sendQuick = async (txt: string) => {
    if (typeof txt === 'string' && txt.trim()) {
      await handleSendNow(txt);
    }
  };

  (window as any).__CHAT_SEND_QUICK__ = sendQuick;

  const onEvt = (e: Event) => {
    const ce = e as CustomEvent<{ text?: string }>;
    const txt = ce?.detail?.text;
    if (typeof txt === 'string') void sendQuick(txt);
  };

  window.addEventListener('chat:sendQuick', onEvt as EventListener);

  return () => {
    try { delete (window as any).__CHAT_SEND_QUICK__; } catch {}
    window.removeEventListener('chat:sendQuick', onEvt as EventListener);
  };
}, [handleSendNow]);


useEffect(() => {
  const root = messagesContainerRef.current;
  const composer = composerRef.current;
  if (!root || !composer) return;

  const setVar = () =>
    root.style.setProperty("--composer-h", `${composer.offsetHeight}px`);

  setVar();

  const ro = new ResizeObserver(setVar);
  ro.observe(composer);
  window.addEventListener("resize", setVar);

  return () => {
    ro.disconnect();
    window.removeEventListener("resize", setVar);
  };
}, []);


useEffect(() => {
  const root = messagesContainerRef.current;
  if (!root) return;

  const onScroll = () => setShowScrollButton(!isAtBottom(root));
  root.addEventListener("scroll", onScroll, { passive: true });

  // chequeo inicial ya con layout listo
  requestAnimationFrame(onScroll);
  return () => root.removeEventListener("scroll", onScroll);
}, []);

useEffect(() => {
  const root = messagesContainerRef.current;
  if (!root) return;
  requestAnimationFrame(() => {
    root.scrollTop = root.scrollHeight;
    setShowScrollButton(false);
  });
}, [conversationId, visibleMessages.length]);

const scrollToBottom = () => {
  const root = messagesContainerRef.current;
  if (!root) return;
  root.scrollTo({ top: root.scrollHeight, behavior: "instant" });
  setShowScrollButton(false);
};

  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const getConversationStringDate = (sentAt: string) => {
    const fecha = parseISO(sentAt);

    if (isToday(fecha)) return "Hoy";
    if (isYesterday(fecha)) return "Ayer";

    const diff = differenceInCalendarDays(new Date(), fecha); // 0 = hoy, 1 = ayer, etc.

    // En los últimos 7 días (excluyendo hoy/ayer ya cubiertos): mostrar día de la semana
    if (diff >= 2 && diff < 7) {
      return cap(format(fecha, "EEEE", { locale: es })); // Lunes, Martes, …
    }

    return format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const handleInsertToComposer = (txt: string) => {
    const glue = text.trim().length ? (text.endsWith(" ") ? "" : " ") : "";
    setText(text + glue + txt);
    textAreaRef.current?.focus();
  };

  // const handleSendNow = async (txt: string) => {
  //   setSelectedOption(txt);
  //   await handleSend();
  // };

  const showEmpty = !conversationId;

  if (showEmpty) {
    return (
      <div className="chat-window__empty">
        <div className="chat-window__empty-icon">
          <MessageSquareMore size={64} />
        </div>
        <h3 className="chat-window__empty-title">Ninguna conversación seleccionada</h3>
        <p className="chat-window__empty-text">Selecciona una conversación para chatear.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
        {searchTerm && (
        <div className="chat-window__searchbar">
          <input
            className="chat-window__searchbar-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en la conversación…"
          />
          <div className="chat-window__searchbar-meta">
            <span>{matchIds.length ? `${matchIndex + 1}/${matchIds.length}` : "0/0"}</span>
            <button onClick={() => gotoMatch(-1)} disabled={!matchIds.length}>◀</button>
            <button onClick={() => gotoMatch(1)} disabled={!matchIds.length}>▶</button>
            <button onClick={() => setSearchTerm("")}>✕</button>
          </div>
        </div>
      )}
      
      <div className="chat-window__messages" onDoubleClick={focusTextarea}  ref={messagesContainerRef}>
        
         {stickyDate && (
        <div className="chat-window__sticky-date">
          <span className="chat-window__date-text chat-window__date-text--dark">
            {stickyDate}
          </span>
        </div>
      )}
        {/* Fecha deve de quedar fija en la parte de arriba*/}
        {/* Y esta misma se ambia en dependenias de cuanto es el mensaje. Como whatsappp */}
        {/*  */}
        {visibleMessages.map((m, i) => {
          const sentAt = formatTime(m.sentAt);
          const isCurrentUser = m.senderUserId === userId;
          const prev = i > 0 ? visibleMessages[i - 1] : null;
          const showSender = !prev || prev.senderUserId !== m.senderUserId;
          const label = getConversationStringDate(m.sentAt);
          const prevLabel = prev ? getConversationStringDate(prev.sentAt) : null;
          const showDivider = !prev || label !== prevLabel;
          const isIncomingFromContact = !isCurrentUser;

          return (
            <React.Fragment key={m.messageId}>
              {/* {showDivider && (
                <div className="chat-window__date-divider">
                  <span className="chat-window__date-text chat-window__date-text--dark">
                    {label}
                  </span>
                </div>
              )} */}
               {showDivider && (
              <div
                className="chat-window__date-divider"
                ref={(el) => { if (el) dateRefs.current[label] = el; }}
              >
                <span className="chat-window__date-text chat-window__date-text--dark">
                  {label}
                </span>
              </div>
            )}

              <div
                className="chat-window_message-group_container"
                onDoubleClick={() => {
                  beginReply(m);
                  focusTextarea();
                }}
              >
                <div
                  ref={registerMessageRef(m.messageId)}
                  className={
                    highlightedId === m.messageId
                      ? `${getMessagePosition(m)} chat-window__message--highlighted`
                      : getMessagePosition(m)
                  }
                >
                  {showSender && !isCurrentUser && (
                    <div className="chat-window__message-sender">
                      {m.senderContactId
                        ? m.senderContactName || "Cliente"
                        : m.senderUserName || "Sistema"}
                    </div>
                  )}

                  <div
                    className={getMessageClassName(m)}
                    {...(isIncomingFromContact
                      ? {
                          onPointerDown: (e: React.PointerEvent) => startLongPress(e, m),
                          onPointerUp: cancelLongPress,
                          onPointerLeave: cancelLongPress,
                          onPointerCancel: cancelLongPress,
                        }
                      : { onDoubleClick: focusTextarea })}
                  >
                    {m.repliedMessage && (
                      <div
                        className="chat-window__reply-preview"
                        onClick={() => scrollToMessage(m.repliedMessage?.messageId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") &&
                          scrollToMessage(m.repliedMessage?.messageId)
                        }
                      >
                        <div className="chat-window__reply-author">
                          {m.repliedMessage.senderContactId
                            ? m.repliedMessage.senderContactName || "Cliente"
                            : m.repliedMessage.senderUserName || "Sistema"}
                        </div>

                        <div className="chat-window__reply-content chat-window__reply-row">
                          {m.repliedMessage.attachments?.length ? (
                            (() => {
                              const att = m.repliedMessage.attachments[0];
                              const mime = att?.mimeType || "";
                              if (mime.startsWith("image/") || mime === "image/webp") {
                                return (
                                  <div className="chat-window__reply-thumb">
                                    <img
                                      src={att.mediaUrl}
                                      alt={att.fileName || "Imagen"}
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
                                    {att.fileName || att.mimeType || "Adjunto"}
                                  </span>
                                </div>
                              );
                            })()
                          ) : (
                            <span className="chat-window__reply-thumb-label">
                              {m.repliedMessage.content
                                ? m.repliedMessage.content.length > 80
                                  ? m.repliedMessage.content.slice(0, 80) + "…"
                                  : m.repliedMessage.content
                                : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="chat-window__message-content">
                      {m.attachments?.length ? (
                        <div className="chat-window__media">
                          {(m.attachments[0].mimeType?.startsWith("image/") ||
                            m.attachments[0].mimeType === "image/webp") && (
                            <div className="chat-window__media-image">
                              <div className="chat-window__image-container">
                                <img
                                  src={m.attachments[0].mediaUrl}
                                  alt={m.attachments[0].fileName || "Imagen"}
                                  className="chat-window__image"
                                  loading="lazy"
                                  onClick={() => openImagePreview(m.attachments![0].mediaUrl!)}
                                />
                              </div>
                            </div>
                          )}

                          {m.attachments[0].mimeType?.startsWith("video/") && (
                            <div className="chat-window__media-video">
                              <video
                                controls
                                className="chat-window__video"
                                src={m.attachments[0].mediaUrl}
                              >
                                Tu navegador no soporta el elemento video.
                              </video>
                            </div>
                          )}

                          {m.attachments[0].mimeType?.startsWith("audio/") && (
                            <div className="chat-window__media-audio">
                              <div className="chat-window__audio-container">
                                <div className="chat-window__audio-icon">🎵</div>
                                <div className="chat-window__audio-info">
                                  <div className="chat-window__audio-name">
                                    {m.attachments[0].fileName || "Audio"}
                                  </div>
                                  <audio
                                    controls
                                    className="chat-window__audio-player"
                                    src={m.attachments[0].mediaUrl}
                                  >
                                    Tu navegador no soporta el elemento audio.
                                  </audio>
                                </div>
                              </div>
                            </div>
                          )}

                          {m.messageType === "Document" && (
                            <div className="chat-window__media-document">
                              <a
                                href={m.attachments[0].mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chat-window__document-link"
                              >
                                <div className="chat-window__document-icon">
                                  {getFileIcon(m.attachments[0].mimeType || "")}
                                </div>
                                <div className="chat-window__document-info">
                                  <div className="chat-window__document-name">
                                    {m.attachments[0].fileName || "Documento"}
                                  </div>
                                  <div className="chat-window__document-size">
                                    {m.attachments[0].mimeType || "Archivo"}
                                  </div>
                                </div>
                                <div className="chat-window__document-download">
                                  <Download size={16} />
                                </div>
                              </a>
                            </div>
                          )}

                          {hasText(m) && (
                           <div className="chat-window__message-caption">
                              {highlightText(String(m.content ?? ""), searchTerm)}
                            </div>
                          )}
                        </div>
                      ) : hasText(m) && (
                        <div className="chat-window__message-text">
                          {highlightText(String(m.content ?? ""), searchTerm)}
                        </div>
                      )
                      }
                    </div>

                    <div className="chat-window__message-info">
                      <span className="chat-window__message-time">{sentAt}</span>
                      {getStatusIcon(m, isCurrentUser)}
                    </div>
                  </div>
                </div>

              </div>

            </React.Fragment>
          );
        })}
        
        <div ref={bottomRef} className="butttonRef" style={{ height: 1 }}/>

              {showScrollButton && (
              <button
                className="chat-window__scroll-button"
                onClick={scrollToBottom}
                title="Bajar al último mensaje"
              >
                <FaArrowDown className="chat-window__scroll-buttonIcon" />
              </button>
            )}
      </div>
      

      <div className="chat-window__composer" ref={composerRef}>

        <label
          htmlFor="file-upload"
          className="chat-window__composer-attachment"
          aria-label="Adjuntar archivo"
        >
          <Paperclip size={20} />
        </label>

        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          className="chat-window__composer-file-input"
          onChange={handleFileChange}
          disabled={!conversationId || sending || conversationStatus == "Closed"}
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
          {replyTo && (
            <div className="chat-window__reply-pill">
              <div className="chat-window__reply-pill-text">
                Respondiendo a {replyTo.author}
              </div>
              <button
                type="button"
                onClick={() => scrollToMessage((replyTo as any)?.messageId)}
                className="chat-window__reply-pill-jump"
                title="Ir al mensaje citado"
              >
                {replyTo.preview}
              </button>
              <button onClick={cancelReply} className="chat-window__reply-pill-close">✕</button>
            </div>
          )}

          <div className="chat-window__composer-input-container__divisor">
            <div
            className="custom_messages__container"
            ref={smsBtnRef}
            onClick={() => setFlyoutOpen(true)}
            title="Mensajes personalizados"
          >
            <SmsIcon className="custom_messages__icon" />
          </div>

            <textarea
              ref={textAreaRef}
              className="chat-window__composer-input"
              placeholder="Escribe un mensaje…"
              value={text}
              autoFocus
              onChange={(e) => {
                setSelectedOption(null);
                setText(e.target.value);
              }}
              onKeyDown={onComposerKeyDown}
              onPaste={handlePaste}
              rows={1}
            />
          </div>

          {flyoutOpen && (
              <div className="cmf-layer">
                <div className="cmf-backdrop" onClick={() => setFlyoutOpen(false)} />
                <CustomMessagesFlyout
                  anchorRect={null}         // <- si no lo necesitas, null
                  open={flyoutOpen}
                  onClose={() => setFlyoutOpen(false)}
                  items={customMessages}
                  loading={loading}
                  error={error}
                  onCreate={create}
                  onUpdate={update}
                  onToggle={toggleSystemParam}
                  onInsertToComposer={handleInsertToComposer}
                  onSendNow={handleSendNow}
                />
              </div>
            )}

        </div>

        <button
          className="chat-window__composer-send"
          onClick={handleSend}
          disabled={
            !conversationId ||
            sending ||
            (!text.trim() && !file) ||
            conversationStatus == "Closed"
          }
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>

      {ismaximize && previewImageUrl && (
        <div className="chat-window__image-preview-overlay" onClick={closeImagePreview}>
          <img src={previewImageUrl} alt="Vista previa" className="chat-window__image-preview-full" />
        </div>
      )}

      {/* {visibleState.quickMenuOpen && (
        <div
          ref={popoverRef}
          className="chat-window__quick-popover"
          style={{ top: visibleState.quickMenuPos.y, left: visibleState.quickMenuPos.x }}
        >
          <button
            type="button"
            onClick={() => {
              if (visibleState.quickMenuMsg) beginReply(visibleState.quickMenuMsg);
              (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>)?.current?.focus();
            }}
            className="chat-window__quick-popover-btn"
          >
            ↩️ Responder
          </button>

          {quickOptions.length > 0 && (
            <>
              <div className="chat-window__quick-popover-divider" />
              <div className="chat-window__quick-popover-title">Respuestas rápidas</div>
              <div className="chat-window__quick-popover-list">
                {quickOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendQuick(opt)}
                    className="chat-window__quick-popover-btn"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )} */}
    </div>
  );
};
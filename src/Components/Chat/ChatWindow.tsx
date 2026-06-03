/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  Download,
  MessageSquareMore,
  Mic,
  Square,
  Trash2,
  Check,
} from "lucide-react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { useChatWindow } from "@/Hooks/Chat/useChatWindow";
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
import { format,isToday,isYesterday, parseISO,differenceInCalendarDays} from "date-fns";
import { es } from "date-fns/locale/es";
import SmsIcon from "@mui/icons-material/Sms";
import { useCustomMessage } from "@/Hooks/Chat/useCustomMesssage";
import { CustomMessagesFlyout } from "@/Components/Chat/CustomMessagesFlyout";
import { FaArrowDown } from "react-icons/fa";
import "@/styles/Chat/ChatWindow.css";
import "@/Styles/Chat/custom-messages-flyout.css";
import { BsEmojiLaughing } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";

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
  highlightTerm?: string;
  validFrom: Date | null;
  validTo: Date | null;
}

export const ChatWindow: React.FC<Props> = ({
  conversationId,
  userId,
  conversationStatus,
  selectedParam,
  highlightTerm,
  validFrom,
  validTo,
}) => {
  const smsBtnRef = useRef<HTMLDivElement | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [stickyDate, setStickyDate] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  const {
    customMessages,
    create,
    update,
    toggleSystemParam,
    loading,
    error,
    load,
    loaded,
  } = useCustomMessage(false);

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
    startLongPress,
    cancelLongPress,
    focusTextarea,
    onComposerKeyDown,
    textAreaRef,
    registerMessageRef,
    scrollToMessage,
    highlightedId,
    searchTerm,
    setSearchTerm,
    matchIds,
    matchIndex,
    gotoMatch,
    renderMessageContent,

    isRecording,
    clearRecording,
    handleSendAudio,
    recordingTime,
    startRecording,
    stopRecording,
    secondsToTime,
  } = useChatWindow(
    {
      conversationId,
      userId,
      conversationStatus,
      selectedParam,
      highlightTerm,
    },
    validFrom,
    validTo
  );

  useEffect(() => {
    if (flyoutOpen && !loaded) void load();
  }, [flyoutOpen, loaded, load]);

  useEffect(() => {
    setConversationId(Number(conversationId));
    setUserId(Number(userId));

    return () => {
      setConversationId(0);
      setUserId(0);
    };
  }, [conversationId, setConversationId, setUserId, userId]);

  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  const getConversationStringDate = (sentAt: string) => {
    const fecha = parseISO(sentAt);

    if (isToday(fecha)) return "Hoy";
    if (isYesterday(fecha)) return "Ayer";

    const diff = differenceInCalendarDays(new Date(), fecha);

    if (diff >= 2 && diff < 7) {
      return cap(format(fecha, "EEEE", { locale: es }));
    }

    return format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const computeStickyDate = React.useCallback(() => {
    const root = messagesContainerRef.current;
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

  useEffect(() => {
    const root = messagesContainerRef.current;
    if (!root) return;

    const onScroll = () => computeStickyDate();

    root.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(computeStickyDate);

    return () => root.removeEventListener("scroll", onScroll);
  }, [computeStickyDate]);

  useEffect(() => {
    dateRefs.current = {};
    requestAnimationFrame(computeStickyDate);
  }, [visibleMessages.length, computeStickyDate]);

  const isAtBottom = (el: HTMLElement) =>
    el.scrollTop >= el.scrollHeight - el.clientHeight - 12;

  const autoResizeTextarea = React.useCallback(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const maxHeight = 120;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [textAreaRef]);

  useEffect(() => {
    autoResizeTextarea();
  }, [text, autoResizeTextarea]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textAreaRef.current;

    if (!textarea) {
      setText(text + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const nuevoTexto = text.slice(0, start) + emoji + text.slice(end);

    setSelectedOption(null);
    setText(nuevoTexto);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      autoResizeTextarea();
    });
  };

  const handleSendNow = React.useCallback(
    async (txt: string) => {
      setSelectedOption(txt);
      setEmojiOpen(false);
      await handleSend();
    },
    [setSelectedOption, handleSend]
  );

  useEffect(() => {
    const sendQuick = async (txt: string) => {
      if (typeof txt === "string" && txt.trim()) await handleSendNow(txt);
    };

    (window as any).__CHAT_SEND_QUICK__ = sendQuick;

    const onEvt = (e: Event) => {
      const ce = e as CustomEvent<{ text?: string }>;
      const txt = ce?.detail?.text;

      if (typeof txt === "string") void sendQuick(txt);
    };

    window.addEventListener("chat:sendQuick", onEvt as EventListener);

    return () => {
      try {
        delete (window as any).__CHAT_SEND_QUICK__;
      } catch {}

      window.removeEventListener("chat:sendQuick", onEvt as EventListener);
    };
  }, [handleSendNow]);

  useEffect(() => {
    const root = messagesContainerRef.current;
    const composer = composerRef.current;

    if (!root || !composer) return;

    const setVar = () => {
      root.style.setProperty("--composer-h", `${composer.offsetHeight}px`);
    };

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

  useEffect(() => {
    if (isRecording) setEmojiOpen(false);
  }, [isRecording]);

  const scrollToBottom = () => {
    const root = messagesContainerRef.current;
    if (!root) return;

    root.scrollTo({ top: root.scrollHeight, behavior: "instant" });
    setShowScrollButton(false);
  };

  const handleInsertToComposer = (txt: string) => {
    const glue = text.trim().length ? (text.endsWith(" ") ? "" : " ") : "";

    setSelectedOption(null);
    setText(text + glue + txt);

    requestAnimationFrame(() => {
      textAreaRef.current?.focus();
      autoResizeTextarea();
    });
  };

  const getReplyAuthor = (rm: any) => {
    if (!rm) return "Mensaje";

    return rm.senderContactId
      ? rm.senderContactName || "Cliente"
      : !rm.incognitoMode
      ? rm.senderUserName || ""
      : "";
  };

  const getReplyPreview = (rm: any) => {
    if (!rm) return "";

    const att = rm.attachments?.[0];
    const txt = String(rm.content ?? "").trim();

    if (att) {
      const mime = String(att.mimeType ?? "");

      if (mime.startsWith("image/") || mime === "image/webp") {
        return att.fileName || "Imagen";
      }

      if (mime.startsWith("video/")) return att.fileName || "Video";
      if (mime.startsWith("audio/")) return att.fileName || "Audio";

      return att.fileName || att.mimeType || "Adjunto";
    }

    if (!txt) return "";

    return txt.length > 90 ? txt.slice(0, 90) + "…" : txt;
  };

  const getReplyIcon = (rm: any) => {
    const att = rm?.attachments?.[0];
    if (!att) return null;

    const mime = String(att.mimeType ?? "");

    if (mime.startsWith("image/") || mime === "image/webp") return "📷";
    if (mime.startsWith("video/")) return "🎬";
    if (mime.startsWith("audio/")) return "🎵";

    return "📎";
  };

  const getReplyThumb = (rm: any) => {
    const att = rm?.attachments?.[0];
    if (!att) return null;

    const mime = String(att.mimeType ?? "");

    if (mime.startsWith("image/") || mime === "image/webp") {
      return att.mediaUrl;
    }

    return null;
  };

  const onJumpToReplied = (m: any) => {
    const id = m?.repliedMessageId ?? m?.repliedMessage?.messageId;
    if (!id) return;

    scrollToMessage(Number(id));
  };

  const showEmpty = !conversationId;

  if (showEmpty) {
    return (
      <div className="chat-window__empty">
        <div className="chat-window__empty-icon">
          <MessageSquareMore size={64} />
        </div>

        <h3 className="chat-window__empty-title">
          Ninguna conversación seleccionada
        </h3>

        <p className="chat-window__empty-text">
          Selecciona una conversación para chatear.
        </p>
      </div>
    );
  }

  const canType = !!conversationId && !sending && conversationStatus !== "Closed";
  const hasAudioToSend = Number(recordingTime ?? 0) > 0;

  const onStartRecord = async () => {
    if (!canType) return;

    setEmojiOpen(false);
    await startRecording();
  };

  const onStopRecord = async () => {
    if (!canType) return;

    await stopRecording();
  };

  const onClearRecord = () => {
    clearRecording();
    focusTextarea();
  };

  const onSendRecord = async () => {
    if (!canType || !hasAudioToSend) return;

    setEmojiOpen(false);
    await handleSendAudio();
    focusTextarea();
  };

  const onSendTextOrFile = async () => {
    setEmojiOpen(false);
    await handleSend();

    requestAnimationFrame(() => {
      autoResizeTextarea();
    });
  };

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
            <span>
              {matchIds.length ? `${matchIndex + 1}/${matchIds.length}` : "0/0"}
            </span>

            <button onClick={() => gotoMatch(-1)} disabled={!matchIds.length}>
              ◀
            </button>

            <button onClick={() => gotoMatch(1)} disabled={!matchIds.length}>
              ▶
            </button>

            <button onClick={() => setSearchTerm("")}>✕</button>
          </div>
        </div>
      )}

      <div
        className="chat-window__messages"
        onDoubleClick={focusTextarea}
        ref={messagesContainerRef}
      >
        {stickyDate && (
          <div className="chat-window__sticky-date">
            <span className="chat-window__date-text chat-window__date-text--dark">
              {stickyDate}
            </span>
          </div>
        )}

        {visibleMessages.map((m, i) => {
          const sentAt = formatTime(m.sentAt);
          const isCurrentUser = m.senderUserId === userId;
          const prev = i > 0 ? visibleMessages[i - 1] : null;
          const showSender = !prev || prev.senderUserId !== m.senderUserId;
          const label = getConversationStringDate(m.sentAt);
          const prevLabel = prev ? getConversationStringDate(prev.sentAt) : null;
          const showDivider = !prev || label !== prevLabel;
          const isIncomingFromContact = !isCurrentUser;

          const hasContacts =
            Array.isArray((m as any).contact) && (m as any).contact.length > 0;

          const isContactMessage = m.messageType === "Contact" || hasContacts;

          const rm = (m as any).repliedMessage;

          return (
            <React.Fragment key={m.messageId}>
              {showDivider && (
                <div
                  className="chat-window__date-divider"
                  ref={(el) => {
                    if (el) dateRefs.current[label] = el;
                  }}
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
                        : !m.incognitoMode
                        ? m.senderUserName || ""
                        : ""}
                    </div>
                  )}

                  <div
                    className={getMessageClassName(m)}
                    {...(isIncomingFromContact
                      ? {
                          onPointerDown: (e: React.PointerEvent) =>
                            startLongPress(e, m),
                          onPointerUp: cancelLongPress,
                          onPointerLeave: cancelLongPress,
                          onPointerCancel: cancelLongPress,
                        }
                      : { onDoubleClick: focusTextarea })}
                    style={
                      m.messageSourceId === 1
                        ? {
                            backgroundColor: m.messageSourceColor ?? "#fff",
                            color: "#fff",
                          }
                        : undefined
                    }
                  >
                    <div className="chat-window__message-content">
                      {rm && (
                        <button
                          type="button"
                          className="chat-window__reply-preview"
                          onClick={() => onJumpToReplied(m)}
                          title="Ir al mensaje citado"
                        >
                          <div className="chat-window__reply-author">
                            {getReplyAuthor(rm)}
                          </div>

                          <div className="chat-window__reply-row">
                            {getReplyThumb(rm) ? (
                              <img
                                src={getReplyThumb(rm) as string}
                                alt="thumb"
                                className="chat-window__reply-thumb-img"
                                loading="lazy"
                              />
                            ) : (
                              <span className="chat-window__reply-ico">
                                {getReplyIcon(rm) ?? ""}
                              </span>
                            )}

                            <span className="chat-window__reply-text">
                              {getReplyPreview(rm)}
                            </span>
                          </div>
                        </button>
                      )}

                      {isContactMessage && (
                        <div className="chat-window__contact-list">
                          {(m as any).contact.map((c: any, idx: number) => {
                            const phone = c?.phones?.[0];

                            const key =
                              phone?.wa_id ||
                              phone?.phone ||
                              c?.name?.formatted_name ||
                              `${m.messageId}-${idx}`;

                            return (
                              <div
                                key={key}
                                className="chat-window__media chat-window__contact-card"
                              >
                                <div className="chat-window__contact-icon">
                                  👤
                                </div>

                                <div className="chat-window__contact-info">
                                  <p className="chat-window__contact-name">
                                    {c?.name?.formatted_name
                                      ? c.name.formatted_name
                                      : "Contacto"}
                                  </p>

                                  {phone?.phone && (
                                    <p className="chat-window__contact-phone">
                                      {phone.phone}

                                      {phone.type ? (
                                        <span className="chat-window__contact-type">
                                          {" "}
                                          ({phone.type})
                                        </span>
                                      ) : null}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!isContactMessage && m.attachments?.length ? (
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
                                  onClick={() =>
                                    openImagePreview(
                                      m.attachments![0].mediaUrl!
                                    )
                                  }
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
                                <div className="chat-window__audio-icon">
                                  🎵
                                </div>

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
                                  {getFileIcon(
                                    m.attachments[0].mimeType || ""
                                  )}
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
                              {renderMessageContent(
                                String(m.content ?? ""),
                                searchTerm
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        hasText(m) && (
                          <div className="chat-window__message-text">
                            {renderMessageContent(
                              String(m.content ?? ""),
                              searchTerm
                            )}
                          </div>
                        )
                      )}
                    </div>

                    <div className="chat-window__message-info">
                      <span className="chat-window__message-time">
                        {sentAt}
                      </span>

                      {getStatusIcon(m, isCurrentUser)}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} className="butttonRef" style={{ height: 1 }} />

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
          disabled={
            !conversationId ||
            sending ||
            conversationStatus === "Closed" ||
            isRecording
          }
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

              <button
                onClick={cancelReply}
                className="chat-window__reply-pill-close"
              >
                ✕
              </button>
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
              placeholder={isRecording ? "Grabando..." : "Escribe un mensaje…"}
              value={text}
              autoFocus
              disabled={isRecording}
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
              <div
                className="cmf-backdrop"
                onClick={() => setFlyoutOpen(false)}
              />

              <CustomMessagesFlyout
                anchorRect={null}
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

        <div className="chat-window__composer-audio">
            <div className="chat-window__emoji-container">
            <button
              type="button"
              className="chat-window__emoji-btn"
              onClick={() => setEmojiOpen((prev) => !prev)}
              disabled={!canType || isRecording}
              title="Agregar emoji"
            >
              
              {!emojiOpen ? <BsEmojiLaughing fontSize={18} />: <IoCloseSharp fontSize={18}/>}
            </button>

            {emojiOpen && (
              <div className="chat-window__emoji-picker">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  previewConfig={{ showPreview: false }}
                  height={360}
                  width={320}
                />
              </div>
            )}
          </div>
          <div className={`chat-window__audio-timer ${isRecording ? "audio-timer__recording": ""}`}>
            {hasAudioToSend ? secondsToTime(recordingTime) : ""}
          </div>

          {!isRecording && !hasAudioToSend && (
            <button
              type="button"
              className="chat-window__audio-btn"
              onClick={onStartRecord}
              disabled={!canType}
              title="Grabar audio"
            >
              <Mic size={24} className="chat-window__audio-icons" />
            </button>
          )}

          {isRecording && (
            <button
              type="button"
              className="chat-window__audio-btn chat-window__audio-btn--stop"
              onClick={onStopRecord}
              disabled={!canType}
              title="Detener"
            >
              <Square size={18} />
            </button>
          )}

          {!isRecording && hasAudioToSend && (
            <>
              <button
                type="button"
                className="chat-window__audio-btn chat-window__audio-btn--send"
                onClick={onSendRecord}
                disabled={!canType}
                title="Enviar audio"
              >
                <Check size={18} />
              </button>

              <button
                type="button"
                className="chat-window__audio-btn chat-window__audio-btn--trash"
                onClick={onClearRecord}
                title="Eliminar audio"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>

        <button
          className="chat-window__composer-send"
          onClick={onSendTextOrFile}
          disabled={
            !conversationId ||
            sending ||
            (!text.trim() && !file) ||
            conversationStatus === "Closed" ||
            isRecording
          }
          aria-label="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>

      {ismaximize && previewImageUrl && (
        <div
          className="chat-window__image-preview-overlay"
          onClick={closeImagePreview}
        >
          <img
            src={previewImageUrl}
            alt="Vista previa"
            className="chat-window__image-preview-full"
          />
        </div>
      )}
    </div>
  );
};
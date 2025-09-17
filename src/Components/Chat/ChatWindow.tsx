/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Send, Paperclip, Download, MessageSquareMore } from "lucide-react";
import "@/styles/Chat/ChatWindow.css";
import { useChatWindow } from "@/Hooks/Chat/useChatWindow";
// import { useCustomMesssage } from "@/Hooks/Chat/useCustomMesssage";
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
// import SmsIcon from "@mui/icons-material/Sms";

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
}

export const ChatWindow: React.FC<Props> = ({
  conversationId,
  userId,
  conversationStatus,
  selectedParam,
}) => {

  const {
    visibleMessages,
    text,
    file,
    sending,
    bottomRef,
    fileInputRef,
    ismaximize,
    previewImageUrl,
    hasText,
    setText,
    setFile,
    handleSend,
    handleFileChange,
    handlePaste,
    getStatusIcon,
    getMessageClassName,
    getMessagePosition,
    getFileIcon,
    openImagePreview,
    closeImagePreview,
    setSelectedOption,
    beginReply,
    cancelReply,
    replyTo,
    highlightedId,
    quickOptions,
    quickMenuMsg,
    quickMenuPos,
    popoverRef,
    quickMenuOpen,
    textAreaRef,
    getConversationStringDate,
    onComposerKeyDown,
    sendQuick,
    focusTextarea,
    cancelLongPress,
    startLongPress,
    scrollToMessage,
    registerMessageRef,
    setQuickMenuOpen,
  } = useChatWindow(selectedParam, conversationStatus);

  if (!conversationId) {
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


  return (
    <div className="chat-window">
      <div className="chat-window__messages" onDoubleClick={focusTextarea}>
        {visibleMessages.map((m, i) => {
          const sentAt = formatTime(m.sentAt);
          const isCurrentUser = m.senderUserId === userId;
          const prev = i > 0 ? visibleMessages[i - 1] : null;
          const showSender = !prev || prev.senderUserId !== m.senderUserId;
          const label = getConversationStringDate(m.sentAt);
          const prevLabel = prev
            ? getConversationStringDate(prev.sentAt)
            : null;
          const showDivider = !prev || label !== prevLabel;
          const isIncomingFromContact = !isCurrentUser;

          return (
            <React.Fragment key={m.messageId}>
              {showDivider && (
                <div className="chat-window__date-divider">
                  <span
                    className="chat-window__date-text"
                    style={{ color: "#000000ff" }}
                  >
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
                  className={getMessagePosition(m)}
                  style={
                    highlightedId === m.messageId
                      ? {
                        boxShadow: "0 0 0 3px rgba(16,185,129,.6)",
                        borderRadius: 12,
                      }
                      : undefined
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
                        onPointerDown: (e: React.PointerEvent) =>
                          startLongPress(e, m),
                        onPointerUp: cancelLongPress,
                        onPointerLeave: cancelLongPress,
                        onPointerCancel: cancelLongPress,
                      }
                      : {
                        onDoubleClick: focusTextarea,
                      })}
                  >
                    {m.repliedMessage && (
                      <div
                        className="chat-window__reply-preview"
                        onClick={() =>
                          scrollToMessage(m.repliedMessage?.messageId)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") &&
                          scrollToMessage(m.repliedMessage?.messageId)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <div className="chat-window__reply-author">
                          {m.repliedMessage.senderContactId
                            ? m.repliedMessage.senderContactName || "Cliente"
                            : m.repliedMessage.senderUserName || "Sistema"}
                        </div>
                        <div
                          className="chat-window__reply-content"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {m.repliedMessage.attachments?.length ? (
                            (() => {
                              const att = m.repliedMessage.attachments[0];
                              const mime = att?.mimeType || "";
                              if (
                                mime.startsWith("image/") ||
                                mime === "image/webp"
                              ) {
                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <img
                                      src={att.mediaUrl}
                                      alt={att.fileName || "Imagen"}
                                      style={{
                                        width: 44,
                                        height: 44,
                                        objectFit: "cover",
                                        borderRadius: 6,
                                        border: "1px solid #e5e7eb",
                                      }}
                                      loading="lazy"
                                    />
                                    <span
                                      style={{ fontSize: 12, color: "#374151" }}
                                    >
                                      {att.fileName || "Imagen"}
                                    </span>
                                  </div>
                                );
                              }
                              if (mime.startsWith("video/")) {
                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <span>🎬</span>
                                    <span
                                      style={{ fontSize: 12, color: "#374151" }}
                                    >
                                      {att.fileName || "Video"}
                                    </span>
                                  </div>
                                );
                              }
                              if (mime.startsWith("audio/")) {
                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <span>🎵</span>
                                    <span
                                      style={{ fontSize: 12, color: "#374151" }}
                                    >
                                      {att.fileName || "Audio"}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span>📄</span>
                                  <span
                                    style={{ fontSize: 12, color: "#374151" }}
                                  >
                                    {att.fileName || att.mimeType || "Adjunto"}
                                  </span>
                                </div>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: 12, color: "#374151" }}>
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
                              {m.content}
                            </div>
                          )}
                        </div>
                      ) : (
                        hasText(m) && (
                          <div className="chat-window__message-text">
                            {m.content}
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
      </div>

      <div className="chat-window__composer">

        <div ref={bottomRef} className="butttonRef" />

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
            !conversationId || sending || conversationStatus == "Closed"
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
            <div
              className="chat-window__reply-pill"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "#f3f4f6",
                borderLeft: "4px solid #10b981",
                padding: "8px 10px",
                borderRadius: 8,
                margin: "0 12px 8px",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Respondiendo a {replyTo.author}
              </div>
              <button
                type="button"
                onClick={() => scrollToMessage((replyTo as any)?.messageId)}
                style={{
                  flex: 1,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
                title="Ir al mensaje citado"
              >
                {replyTo.preview}
              </button>
              <button
                onClick={cancelReply}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="chat-window__composer-input-container__divisor">

            {/* <div className="custom_messages__container" onClick={getCustomoMessageByAgent}>
              <SmsIcon className="custom_messages__icon" />
            </div> */}

            <textarea
              ref={textAreaRef}
              className="chat-window__composer-input"
              placeholder="Escribe un mensaje…"
              value={text}
              onChange={(e) => {
                setSelectedOption(null);
                setText(e.target.value);
              }}
              onKeyDown={onComposerKeyDown}
              onPaste={handlePaste}
              rows={1}
            />
          </div>
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

      {quickMenuOpen && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: quickMenuPos.y,
            left: quickMenuPos.x,
            transform: "translate(-50%, -100%)",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            padding: 8,
            width: 260,
            zIndex: 9999,
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (quickMenuMsg) beginReply(quickMenuMsg);
              setQuickMenuOpen(false);
              textAreaRef.current?.focus();
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ↩️ Responder
          </button>

          {quickOptions.length > 0 && (
            <>
              <div style={{ height: 1, background: "#eee", margin: "6px 0" }} />
              <div style={{ fontSize: 12, opacity: 0.7, padding: "4px 8px" }}>
                Respuestas rápidas
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {quickOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendQuick(opt)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
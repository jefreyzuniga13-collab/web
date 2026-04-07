import * as signalR from "@microsoft/signalr";
import type {
    AttachmentDto,
    ConversationDto,
    MessageDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import { formatDateTimeNI } from "@/Utils/ECommerce/formatters";
import { getChatConnection } from "@/Services/signalr/connections";
import type { ReceiveMessagePayload } from "@/Services/signalr/types";
// Exponer eventos y acciones del chat hub.

const receiveMessageHandlers = new Map<
  (payload: ReceiveMessagePayload) => void,
  (message: MessageDto, attachments?: AttachmentDto[]) => void
>();

export function joinConversation(conversationId: number) {
  const connection = getChatConnection();

  if (connection?.state === signalR.HubConnectionState.Connected) {
    void connection.invoke("JoinConversation", conversationId.toString());
  }
}

export function leaveConversation(conversationId: number) {
  const connection = getChatConnection();

  if (connection?.state === signalR.HubConnectionState.Connected) {
    void connection.invoke("LeaveConversation", conversationId.toString());
  }
}

export function onNewMessage(
  handler: (payload: ReceiveMessagePayload) => void
) {
  const connection = getChatConnection();

  if (!connection) return () => {};

  if (receiveMessageHandlers.has(handler)) {
    return () => {
      const stored = receiveMessageHandlers.get(handler);
      if (!stored) return;

      connection.off("ReceiveMessage", stored);
      receiveMessageHandlers.delete(handler);
    };
  }

  const callback = (message: MessageDto, attachments?: AttachmentDto[]) => {
    try {
      handler({
        message,
        attachments: attachments ?? [],
      });

      const sentAtText = message?.sentAt ? formatDateTimeNI(message.sentAt) : "";
      const title = `${message?.senderClientName ?? ""} ${message?.senderContactName ?? message?.senderUserName ?? ""} recibido: ${sentAtText}`;
      const body =
        (message?.content && message.content.trim()) || "(Mensaje con adjunto)";
      const url = "https://staging.dsujq9sb48iiw.amplifyapp.com/chat/";

      window.dispatchEvent(
        new CustomEvent("DesktopNotify", {
          detail: {
            title,
            body,
            url,
            conversationId: message?.conversationId,
          },
        })
      );
    } catch (error) {
      console.error("Error en ReceiveMessage", error);
    }
  };

  receiveMessageHandlers.set(handler, callback);
  connection.on("ReceiveMessage", callback);

  return () => {
    const stored = receiveMessageHandlers.get(handler);
    if (!stored) return;

    connection.off("ReceiveMessage", stored);
    receiveMessageHandlers.delete(handler);
  };
}

export function offNewMessage(
  handler: (payload: ReceiveMessagePayload) => void
) {
  const connection = getChatConnection();
  const stored = receiveMessageHandlers.get(handler);

  if (connection && stored) {
    connection.off("ReceiveMessage", stored);
    receiveMessageHandlers.delete(handler);
  }
}

export function onConversationCreated(handler: (dto: ConversationDto) => void) {
  getChatConnection()?.on("ConversationCreated", handler);
}

export function offConversationCreated(handler: (dto: ConversationDto) => void) {
  getChatConnection()?.off("ConversationCreated", handler);
}

export function onConversationUpdated(handler: (dto: ConversationDto) => void) {
  getChatConnection()?.on("ConversationUpdated", handler);
}

export function offConversationUpdated(handler: (dto: ConversationDto) => void) {
  getChatConnection()?.off("ConversationUpdated", handler);
}
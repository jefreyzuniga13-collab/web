/* eslint-disable @typescript-eslint/no-unused-vars */
import * as signalR from "@microsoft/signalr";

import type {
  AttachmentDto,
  ConversationDto,
  MessageDto,
  NotificationDto,
} from "@/Interfaces/Chat/ChatInterfaces";

import type { ContactLog } from "@/Interfaces/Auth/UserInterfaces";
import type { ForceLogoutDto } from "@/Interfaces/Auth/AuthInterface";

import { formatDateTimeNI } from "@/Utils/ECommerce/formatters";
import { store } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { clearCart } from "@/Context/Slices/Ecommerce/cartSlice";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

const HUB_BASE = API_URL.replace(/\/api\/v1$/, "");

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL?.replace(/\/+$/, "");

let chatConnection: signalR.HubConnection | null = null;

export let notificationsConnection: signalR.HubConnection | null = null;

export let presenceConnection: signalR.HubConnection | null = null;

export let userConeccion: signalR.HubConnection | null = null;

let startPromise: Promise<HubConnections> | null = null;
let reconnectTimer: number | null = null;
let isStoppingManually = false;

type HubConnections = {
  chatConnection: signalR.HubConnection | null;
  notificationsConnection: signalR.HubConnection | null;
  presenceConnection: signalR.HubConnection | null;
  userConeccion: signalR.HubConnection | null;
};

export type SoundDto = {
  conversationId: number;
  messageId?: number | null;
  senderUserId?: number | null;
  senderContactId?: number | null;
  kind: "new_conversation" | "message" | "close";
  at?: string | null;
};

export type NewMessagePayload = {
  message: MessageDto;
  attachments: AttachmentDto[];
};

export type NewMessageHandler = (payload: NewMessagePayload) => void;

type ReceiveMessageCallback = (
  message: MessageDto,
  attachments?: AttachmentDto[],
) => void;

const receiveHandlers = new Map<NewMessageHandler, ReceiveMessageCallback>();

const conversationCreatedHandlers = new Map<
  (conversation: ConversationDto) => void,
  (conversation: ConversationDto) => void
>();

const conversationUpdatedHandlers = new Map<
  (conversation: ConversationDto) => void,
  (conversation: ConversationDto) => void
>();

const newHumanRequestHandlers = new Map<
  (payload: { conversationId: number; fromPhone: string }) => void,
  (payload: { conversationId: number; fromPhone: string }) => void
>();

const messageStatusChangedHandlers = new Map<
  (message: MessageDto) => void,
  (message: MessageDto) => void
>();

const notificationHandlers = new Map<
  (notification: NotificationDto) => void,
  (notification: NotificationDto) => void
>();

const supportRequestedHandlers = new Map<
  (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void,
  (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void
>();

const receiveAssignmentHandlers = new Map<
  (conversation: ConversationDto) => void,
  (conversation: ConversationDto) => void
>();

const assignmentResponseHandlers = new Map<
  (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => void,
  (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => void
>();

const assignmentForcedHandlers = new Map<
  (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void,
  (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void
>();

const assignmentForcedAdminHandlers = new Map<
  (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void,
  (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void
>();

const newContactValidationHandlers = new Map<
  (payload: { contactLog: ContactLog }) => void,
  (payload: { contactLog: ContactLog }) => void
>();

const legacyPlaySoundHandlers = new Map<
  (senderUserId: number) => void,
  (senderUserId: number) => void
>();

const playSoundHandlers = new Map<
  (dto: SoundDto) => void,
  (payload: unknown) => void
>();

/**
 * Evento recibido desde UserHub cuando la sesión actual
 * fue revocada desde otro dispositivo.
 */
const forceLogoutHandlers = new Map<
  (payload: ForceLogoutDto) => void,
  (payload: ForceLogoutDto) => void
>();

/**
 * Nota técnica histórica:
 * algunos usuarios presentaron ciclos de desconexión y reconexión.
 * La reconexión manual se conserva como respaldo de AutomaticReconnect.
 */
function buildConnection(url: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
    .withServerTimeout(60000)
    .withKeepAliveInterval(15000)
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

function getActiveCompanyId(): number | null {
  const state = store.getState();

  const isRoot = state.auth?.isRoot;
  const activeCompanyId = state.company?.activeCompanyId;

  if (!isRoot) {
    return null;
  }

  if (!activeCompanyId || Number(activeCompanyId) <= 0) {
    return null;
  }

  return Number(activeCompanyId);
}

function shouldStartHubs(): boolean {
  const state = store.getState();

  const isAuthenticated = state.auth?.isAuthenticated;
  const isRoot = state.auth?.isRoot;
  const activeCompanyId = state.company?.activeCompanyId;

  if (!isAuthenticated) {
    return false;
  }

  if (isRoot && (!activeCompanyId || Number(activeCompanyId) <= 0)) {
    return false;
  }

  return true;
}

function buildHubUrl(path: string): string {
  const companyId = getActiveCompanyId();

  if (!companyId) {
    return `${HUB_BASE}${path}`;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${HUB_BASE}${path}${separator}companyId=${encodeURIComponent(
    String(companyId),
  )}`;
}

function isConnected(connection: signalR.HubConnection | null): boolean {
  return connection?.state === signalR.HubConnectionState.Connected;
}

function clearReconnectTimer(): void {
  if (!reconnectTimer) {
    return;
  }

  window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function scheduleReconnect(): void {
  if (isStoppingManually) {
    return;
  }

  if (reconnectTimer) {
    return;
  }

  if (!shouldStartHubs()) {
    return;
  }

  reconnectTimer = window.setTimeout(async () => {
    reconnectTimer = null;

    if (!shouldStartHubs()) {
      return;
    }

    try {
      await restartHubConnection();
    } catch (error) {
      console.warn("[SignalR] Reintento fallido", error);
      scheduleReconnect();
    }
  }, 5000);
}

async function ensureStarted(
  connection: signalR.HubConnection | null,
): Promise<void> {
  if (!connection) {
    return;
  }

  if (connection.state === signalR.HubConnectionState.Connected) {
    return;
  }

  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start();
    return;
  }

  if (
    connection.state === signalR.HubConnectionState.Connecting ||
    connection.state === signalR.HubConnectionState.Reconnecting
  ) {
    await waitUntilConnected(connection);
  }
}

function waitUntilConnected(connection: signalR.HubConnection): Promise<void> {
  return new Promise((resolve, reject) => {
    const maxWaitMs = 20000;
    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        window.clearInterval(interval);
        resolve();
        return;
      }

      if (connection.state === signalR.HubConnectionState.Disconnected) {
        window.clearInterval(interval);
        reject(new Error("La conexión SignalR quedó desconectada."));
        return;
      }

      if (Date.now() - startedAt >= maxWaitMs) {
        window.clearInterval(interval);
        reject(new Error("Tiempo de espera agotado al conectar SignalR."));
      }
    }, 100);
  });
}

function emitDesktopNotify(detail: {
  title: string;
  body: string;
  url: string;
  conversationId?: number;
}): void {
  window.dispatchEvent(
    new CustomEvent("DesktopNotify", {
      detail,
    }),
  );
}

function normalizeSoundDto(payload: unknown): SoundDto {
  const value = payload as Partial<SoundDto>;
  const rawKind = String(value?.kind ?? "message");

  const kind: SoundDto["kind"] =
    rawKind === "new_conversation" ||
    rawKind === "close" ||
    rawKind === "message"
      ? rawKind
      : "message";

  return {
    conversationId: Number(value?.conversationId ?? 0),
    messageId: value?.messageId != null ? Number(value.messageId) : null,
    senderUserId:
      value?.senderUserId != null ? Number(value.senderUserId) : null,
    senderContactId:
      value?.senderContactId != null ? Number(value.senderContactId) : null,
    kind,
    at: value?.at != null ? String(value.at) : null,
  };
}

function normalizeReceivedMessage(
  message: MessageDto,
  attachments?: AttachmentDto[],
): MessageDto {
  const resolvedAttachments =
    Array.isArray(attachments) && attachments.length > 0
      ? attachments
      : Array.isArray(message.attachments)
        ? message.attachments
        : [];

  return {
    ...message,
    attachments: resolvedAttachments,
    contact: Array.isArray(message.contact) ? message.contact : [],
    referral: message.referral ?? null,
    repliedMessage: message.repliedMessage
      ? {
          ...message.repliedMessage,
          attachments: Array.isArray(message.repliedMessage.attachments)
            ? message.repliedMessage.attachments
            : [],
          contact: Array.isArray(message.repliedMessage.contact)
            ? message.repliedMessage.contact
            : [],
          referral: message.repliedMessage.referral ?? null,
        }
      : null,
  };
}

function getDesktopMessageBody(message: MessageDto): string {
  const content = message.content?.trim();

  if (content) {
    return content;
  }

  const referralHeadline = message.referral?.headline?.trim();

  if (referralHeadline) {
    return `Anuncio: ${referralHeadline}`;
  }

  if (message.referral) {
    return "Mensaje recibido desde un anuncio";
  }

  if (message.attachments.length > 0) {
    return "Mensaje con adjunto";
  }

  return "Nuevo mensaje recibido";
}

function bindConnectionLifecycle(
  connection: signalR.HubConnection,
  name: string,
  onReconnected?: () => void,
): void {
  connection.onreconnecting((error) => {
    console.warn(`[${name}] Reconectando...`, error);
  });

  connection.onreconnected(() => {
    console.info(`[${name}] Reconectado`);
    onReconnected?.();
  });

  connection.onclose((error) => {
    console.warn(`[${name}] Conexión cerrada`, error);
    scheduleReconnect();
  });
}

function bindNotificationBridgeHandlers(
  connection: signalR.HubConnection,
): void {
  /*
   * Solo se conservan aquí los eventos que no poseen un API público
   * de suscripción dentro de este archivo.
   *
   * Los eventos de soporte, asignación y validación de contacto se
   * administran mediante sus respectivos Maps. Registrarlos también
   * como CustomEvent generaba entregas duplicadas.
   */
  connection.off("cart:updated");
  connection.on(
    "cart:updated",
    (payload: { contactId: number; orderId: number }) => {
      store.dispatch(
        setContactCartBadge({
          contactId: payload.contactId,
          hasCart: true,
          count:
            store.getState().cartBadge.byContactId?.[payload.contactId]
              ?.count ?? 0,
        }),
      );

      const activeContactId = store.getState().cart.activeContactId;

      if (activeContactId === payload.contactId) {
        window.dispatchEvent(
          new CustomEvent("CartReloadForActiveContact", {
            detail: payload,
          }),
        );
      }
    },
  );

  connection.off("cart:cleared");
  connection.on(
    "cart:cleared",
    (payload: {
      contactId: number;
      orderId: number;
      conversationId: number;
    }) => {
      const draftKey = `cartDraft:v1:${payload.conversationId}:${payload.contactId}`;

      localStorage.removeItem(draftKey);
      sessionStorage.removeItem(draftKey);

      store.dispatch(
        setContactCartBadge({
          contactId: payload.contactId,
          hasCart: false,
          count: 0,
        }),
      );

      const activeContactId = store.getState().cart?.activeContactId ?? null;

      if (activeContactId === payload.contactId) {
        store.dispatch(clearCart());

        window.dispatchEvent(
          new CustomEvent("CartClearedForActiveContact", {
            detail: payload,
          }),
        );
      }
    },
  );
}

function bindPresenceHandlers(connection: signalR.HubConnection): void {
  connection.off("UserIsOnline");
  connection.on("UserIsOnline", (_userId: number) => {});

  connection.off("UserIsOffline");
  connection.on("UserIsOffline", (_userId: number) => {});
}

function rebindRegisteredHandlers(): void {
  if (chatConnection) {
    receiveHandlers.forEach((callback) => {
      chatConnection!.off("ReceiveMessage", callback);
      chatConnection!.on("ReceiveMessage", callback);
    });

    conversationCreatedHandlers.forEach((callback) => {
      chatConnection!.off("ConversationCreated", callback);
      chatConnection!.on("ConversationCreated", callback);
    });

    conversationUpdatedHandlers.forEach((callback) => {
      chatConnection!.off("ConversationUpdated", callback);
      chatConnection!.on("ConversationUpdated", callback);
    });
  }

  if (notificationsConnection) {
    newHumanRequestHandlers.forEach((callback) => {
      notificationsConnection!.off("NewHumanRequest", callback);
      notificationsConnection!.on("NewHumanRequest", callback);
    });

    messageStatusChangedHandlers.forEach((callback) => {
      notificationsConnection!.off("MessageStatusChanged", callback);
      notificationsConnection!.on("MessageStatusChanged", callback);
    });

    notificationHandlers.forEach((callback) => {
      notificationsConnection!.off("Notification", callback);
      notificationsConnection!.on("Notification", callback);
    });

    supportRequestedHandlers.forEach((callback) => {
      notificationsConnection!.off("SupportRequested", callback);
      notificationsConnection!.on("SupportRequested", callback);
    });

    receiveAssignmentHandlers.forEach((callback) => {
      notificationsConnection!.off("ConversationAssigned", callback);
      notificationsConnection!.on("ConversationAssigned", callback);
    });

    assignmentResponseHandlers.forEach((callback) => {
      notificationsConnection!.off("AssignmentResponse", callback);
      notificationsConnection!.on("AssignmentResponse", callback);
    });

    assignmentForcedHandlers.forEach((callback) => {
      notificationsConnection!.off("AssignmentForced", callback);
      notificationsConnection!.on("AssignmentForced", callback);
    });

    assignmentForcedAdminHandlers.forEach((callback) => {
      notificationsConnection!.off("AssignmentForcedAdmin", callback);
      notificationsConnection!.on("AssignmentForcedAdmin", callback);
    });

    newContactValidationHandlers.forEach((callback) => {
      notificationsConnection!.off("newContactValidation", callback);
      notificationsConnection!.on("newContactValidation", callback);
    });

    legacyPlaySoundHandlers.forEach((callback) => {
      notificationsConnection!.off("PlayNewMessageSound", callback);
      notificationsConnection!.on("PlayNewMessageSound", callback);
    });

    playSoundHandlers.forEach((callback) => {
      notificationsConnection!.off("PlaySound", callback);
      notificationsConnection!.on("PlaySound", callback);
    });
  }

  /*
   * UserHub contiene los eventos vinculados al usuario y a su sesión.
   * Se vuelven a registrar después de cada reconexión.
   */
  if (userConeccion) {
    forceLogoutHandlers.forEach((callback) => {
      userConeccion!.off("ForceLogout", callback);
      userConeccion!.on("ForceLogout", callback);
    });
  }
}

export async function createHubConnection(): Promise<HubConnections> {
  if (!shouldStartHubs()) {
    await stopHubConnection();

    return {
      chatConnection: null,
      notificationsConnection: null,
      presenceConnection: null,
      userConeccion: null,
    };
  }

  if (startPromise) {
    return startPromise;
  }

  startPromise = (async () => {
    isStoppingManually = false;
    clearReconnectTimer();

    if (
      isConnected(chatConnection) &&
      isConnected(notificationsConnection) &&
      isConnected(presenceConnection) &&
      isConnected(userConeccion)
    ) {
      return {
        chatConnection,
        notificationsConnection,
        presenceConnection,
        userConeccion,
      };
    }

    if (!chatConnection) {
      chatConnection = buildConnection(buildHubUrl("/hubs/chat"));

      bindConnectionLifecycle(chatConnection, "CHAT", () => {
        rebindRegisteredHandlers();
      });
    }

    if (!notificationsConnection) {
      notificationsConnection = buildConnection(
        buildHubUrl("/hubs/notifications"),
      );

      bindNotificationBridgeHandlers(notificationsConnection);

      bindConnectionLifecycle(notificationsConnection, "NOTIFICATIONS", () => {
        bindNotificationBridgeHandlers(notificationsConnection!);

        rebindRegisteredHandlers();
      });
    }

    if (!presenceConnection) {
      presenceConnection = buildConnection(buildHubUrl("/hubs/presence"));

      bindPresenceHandlers(presenceConnection);

      bindConnectionLifecycle(presenceConnection, "PRESENCE", () => {
        bindPresenceHandlers(presenceConnection!);
      });
    }

    if (!userConeccion) {
      userConeccion = buildConnection(buildHubUrl("/hubs/users"));

      bindConnectionLifecycle(userConeccion, "USER", () => {
        rebindRegisteredHandlers();
      });
    }

    await Promise.all([
      ensureStarted(chatConnection),
      ensureStarted(notificationsConnection),
      ensureStarted(presenceConnection),
      ensureStarted(userConeccion),
    ]);

    rebindRegisteredHandlers();

    return {
      chatConnection,
      notificationsConnection,
      presenceConnection,
      userConeccion,
    };
  })();

  try {
    return await startPromise;
  } catch (error) {
    scheduleReconnect();
    throw error;
  } finally {
    startPromise = null;
  }
}

export async function stopHubConnection(): Promise<void> {
  isStoppingManually = true;
  clearReconnectTimer();

  const connections = [
    chatConnection,
    notificationsConnection,
    presenceConnection,
    userConeccion,
  ];

  await Promise.all(
    connections.map(async (connection) => {
      if (!connection) {
        return;
      }

      if (connection.state === signalR.HubConnectionState.Disconnected) {
        return;
      }

      try {
        await connection.stop();
      } catch (error) {
        console.warn("[SignalR] Error al detener conexión", error);
      }
    }),
  );

  chatConnection = null;
  notificationsConnection = null;
  presenceConnection = null;
  userConeccion = null;
  startPromise = null;
}

export async function restartHubConnection(): Promise<void> {
  await stopHubConnection();

  isStoppingManually = false;

  await createHubConnection();
}

export async function joinConversation(conversationId: number): Promise<void> {
  await createHubConnection();

  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    await chatConnection.invoke("JoinConversation", conversationId.toString());
  }
}

export async function leaveConversation(conversationId: number): Promise<void> {
  if (chatConnection?.state !== signalR.HubConnectionState.Connected) {
    return;
  }

  await chatConnection.invoke("LeaveConversation", conversationId.toString());
}

export function onNewMessage(handler: NewMessageHandler) {
  if (receiveHandlers.has(handler)) {
    return () => offNewMessage(handler);
  }

  const callback: ReceiveMessageCallback = (message, attachments) => {
    try {
      const normalizedMessage = normalizeReceivedMessage(message, attachments);

      handler({
        message: normalizedMessage,
        attachments: normalizedMessage.attachments,
      });

      const sentAtText = normalizedMessage.sentAt
        ? formatDateTimeNI(normalizedMessage.sentAt)
        : "";

      const senderName =
        normalizedMessage.senderContactName ??
        normalizedMessage.senderUserName ??
        "";

      const clientName = normalizedMessage.senderClientName ?? "";

      const title = [clientName, senderName]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" ");

      emitDesktopNotify({
        title: title
          ? `${title} recibido: ${sentAtText}`
          : `Mensaje recibido: ${sentAtText}`,
        body: getDesktopMessageBody(normalizedMessage),
        url: `${PORTAL_URL}/chat/`,
        conversationId: normalizedMessage.conversationId,
      });
    } catch (error) {
      console.error("Error en onNewMessage:", error);
    }
  };

  receiveHandlers.set(handler, callback);

  if (chatConnection) {
    chatConnection.off("ReceiveMessage", callback);
    chatConnection.on("ReceiveMessage", callback);
  }

  return () => offNewMessage(handler);
}

export function offNewMessage(handler: NewMessageHandler): void {
  const stored = receiveHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ReceiveMessage", stored);
  }

  receiveHandlers.delete(handler);
}

export function onConversationCreated(
  handler: (conversation: ConversationDto) => void,
) {
  if (conversationCreatedHandlers.has(handler)) {
    return () => offConversationCreated(handler);
  }

  const callback = (conversation: ConversationDto) => {
    handler(conversation);
  };

  conversationCreatedHandlers.set(handler, callback);

  if (chatConnection) {
    chatConnection.off("ConversationCreated", callback);
    chatConnection.on("ConversationCreated", callback);
  }

  return () => offConversationCreated(handler);
}

export function offConversationCreated(
  handler: (conversation: ConversationDto) => void,
): void {
  const stored = conversationCreatedHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ConversationCreated", stored);
  }

  conversationCreatedHandlers.delete(handler);
}

export function onConversationUpdated(
  handler: (conversation: ConversationDto) => void,
) {
  if (conversationUpdatedHandlers.has(handler)) {
    return () => offConversationUpdated(handler);
  }

  const callback = (conversation: ConversationDto) => {
    handler(conversation);
  };

  conversationUpdatedHandlers.set(handler, callback);

  if (chatConnection) {
    chatConnection.off("ConversationUpdated", callback);
    chatConnection.on("ConversationUpdated", callback);
  }

  return () => offConversationUpdated(handler);
}

export function offConversationUpdated(
  handler: (conversation: ConversationDto) => void,
): void {
  const stored = conversationUpdatedHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ConversationUpdated", stored);
  }

  conversationUpdatedHandlers.delete(handler);
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void,
) {
  if (newHumanRequestHandlers.has(handler)) {
    return () => offNewHumanRequest(handler);
  }

  const callback = (payload: { conversationId: number; fromPhone: string }) => {
    handler(payload);
  };

  newHumanRequestHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("NewHumanRequest", callback);

    notificationsConnection.on("NewHumanRequest", callback);
  }

  return () => offNewHumanRequest(handler);
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void,
): void {
  const stored = newHumanRequestHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("NewHumanRequest", stored);
  }

  newHumanRequestHandlers.delete(handler);
}

export function onMessageStatusChanged(handler: (message: MessageDto) => void) {
  if (messageStatusChangedHandlers.has(handler)) {
    return () => offMessageStatusChanged(handler);
  }

  const callback = (message: MessageDto) => {
    handler(message);
  };

  messageStatusChangedHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("MessageStatusChanged", callback);

    notificationsConnection.on("MessageStatusChanged", callback);
  }

  return () => offMessageStatusChanged(handler);
}

export function offMessageStatusChanged(
  handler: (message: MessageDto) => void,
): void {
  const stored = messageStatusChangedHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("MessageStatusChanged", stored);
  }

  messageStatusChangedHandlers.delete(handler);
}

export function onNewNotification(
  handler: (notification: NotificationDto) => void,
) {
  if (notificationHandlers.has(handler)) {
    return () => offNewNotification(handler);
  }

  const callback = (notification: NotificationDto) => {
    handler(notification);
  };

  notificationHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("Notification", callback);

    notificationsConnection.on("Notification", callback);
  }

  return () => offNewNotification(handler);
}

export function offNewNotification(
  handler: (notification: NotificationDto) => void,
): void {
  const stored = notificationHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("Notification", stored);
  }

  notificationHandlers.delete(handler);
}

export function onSupportRequested(
  handler: (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void,
) {
  if (supportRequestedHandlers.has(handler)) {
    return () => offSupportRequested(handler);
  }

  const callback = (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  supportRequestedHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("SupportRequested", callback);

    notificationsConnection.on("SupportRequested", callback);
  }

  return () => offSupportRequested(handler);
}

export function offSupportRequested(
  handler: (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void,
): void {
  const stored = supportRequestedHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("SupportRequested", stored);
  }

  supportRequestedHandlers.delete(handler);
}

export function onConversationAssigned(
  handler: (conversation: ConversationDto) => void,
) {
  if (receiveAssignmentHandlers.has(handler)) {
    return () => offConversationAssigned(handler);
  }

  const callback = (conversation: ConversationDto) => {
    try {
      handler(conversation);

      emitDesktopNotify({
        title: `Nueva asignación de ${conversation?.clientName ?? ""}`,
        body: `Le han asignado una nueva conversación del contacto: ${
          conversation?.clientContactName ?? ""
        }`,
        url: `${PORTAL_URL}/chat/`,
        conversationId: conversation?.conversationId,
      });
    } catch (error) {
      console.error("[onConversationAssigned] Error:", error);
    }
  };

  receiveAssignmentHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("ConversationAssigned", callback);

    notificationsConnection.on("ConversationAssigned", callback);
  }

  return () => offConversationAssigned(handler);
}

export function offConversationAssigned(
  handler: (conversation: ConversationDto) => void,
): void {
  const stored = receiveAssignmentHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("ConversationAssigned", stored);
  }

  receiveAssignmentHandlers.delete(handler);
}

export function onAssignmentResponse(
  handler: (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => void,
) {
  if (assignmentResponseHandlers.has(handler)) {
    return () => offAssignmentResponse(handler);
  }

  const callback = (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  assignmentResponseHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("AssignmentResponse", callback);

    notificationsConnection.on("AssignmentResponse", callback);
  }

  return () => offAssignmentResponse(handler);
}

export function offAssignmentResponse(
  handler: (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => void,
): void {
  const stored = assignmentResponseHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("AssignmentResponse", stored);
  }

  assignmentResponseHandlers.delete(handler);
}

export function onAssignmentForced(
  handler: (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void,
) {
  if (assignmentForcedHandlers.has(handler)) {
    return () => offAssignmentForced(handler);
  }

  const callback = (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  assignmentForcedHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("AssignmentForced", callback);

    notificationsConnection.on("AssignmentForced", callback);
  }

  return () => offAssignmentForced(handler);
}

export function offAssignmentForced(
  handler: (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void,
): void {
  const stored = assignmentForcedHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("AssignmentForced", stored);
  }

  assignmentForcedHandlers.delete(handler);
}

export function onAssignmentForcedAdmin(
  handler: (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void,
) {
  if (assignmentForcedAdminHandlers.has(handler)) {
    return () => offAssignmentForcedAdmin(handler);
  }

  const callback = (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  assignmentForcedAdminHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("AssignmentForcedAdmin", callback);

    notificationsConnection.on("AssignmentForcedAdmin", callback);
  }

  return () => offAssignmentForcedAdmin(handler);
}

export function offAssignmentForcedAdmin(
  handler: (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void,
): void {
  const stored = assignmentForcedAdminHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("AssignmentForcedAdmin", stored);
  }

  assignmentForcedAdminHandlers.delete(handler);
}

export function onNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void,
) {
  if (newContactValidationHandlers.has(handler)) {
    return () => offNewContactValidation(handler);
  }

  const callback = (payload: { contactLog: ContactLog }) => {
    handler(payload);
  };

  newContactValidationHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("newContactValidation", callback);

    notificationsConnection.on("newContactValidation", callback);
  }

  return () => offNewContactValidation(handler);
}

export function offNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void,
): void {
  const stored = newContactValidationHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("newContactValidation", stored);
  }

  newContactValidationHandlers.delete(handler);
}

export function offNewContact(): void {
  notificationsConnection?.off("newContactValidation");
  userConeccion?.off("newContactValidation");
  newContactValidationHandlers.clear();
}

/**
 * Escucha el cierre forzado dirigido exclusivamente
 * a la sesión anterior.
 */
export function onForceLogout(handler: (payload: ForceLogoutDto) => void) {
  if (forceLogoutHandlers.has(handler)) {
    return () => offForceLogout(handler);
  }

  const callback = (payload: ForceLogoutDto) => {
    handler(payload);
  };

  forceLogoutHandlers.set(handler, callback);

  if (userConeccion) {
    userConeccion.off("ForceLogout", callback);
    userConeccion.on("ForceLogout", callback);
  }

  return () => offForceLogout(handler);
}

/**
 * Deja de escuchar el cierre forzado de sesión.
 */
export function offForceLogout(
  handler: (payload: ForceLogoutDto) => void,
): void {
  const stored = forceLogoutHandlers.get(handler);

  if (stored && userConeccion) {
    userConeccion.off("ForceLogout", stored);
  }

  forceLogoutHandlers.delete(handler);
}

export function onPlayNewMessageSound(handler: (senderUserId: number) => void) {
  if (legacyPlaySoundHandlers.has(handler)) {
    return () => offPlayNewMessageSound(handler);
  }

  const callback = (senderUserId: number) => {
    handler(Number(senderUserId ?? 0));
  };

  legacyPlaySoundHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("PlayNewMessageSound", callback);

    notificationsConnection.on("PlayNewMessageSound", callback);
  }

  return () => offPlayNewMessageSound(handler);
}

export function offPlayNewMessageSound(
  handler: (senderUserId: number) => void,
): void {
  const stored = legacyPlaySoundHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("PlayNewMessageSound", stored);
  }

  legacyPlaySoundHandlers.delete(handler);
}

export function onPlaySound(handler: (dto: SoundDto) => void) {
  if (playSoundHandlers.has(handler)) {
    return () => offPlaySound(handler);
  }

  const callback = (payload: unknown) => {
    const dto = normalizeSoundDto(payload);
    handler(dto);
  };

  playSoundHandlers.set(handler, callback);

  if (notificationsConnection) {
    notificationsConnection.off("PlaySound", callback);
    notificationsConnection.on("PlaySound", callback);
  }

  return () => offPlaySound(handler);
}

export function offPlaySound(handler: (dto: SoundDto) => void): void {
  const stored = playSoundHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("PlaySound", stored);
  }

  playSoundHandlers.delete(handler);
}
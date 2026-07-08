/* eslint-disable @typescript-eslint/no-unused-vars */
import * as signalR from "@microsoft/signalr";
import type {
  MessageDto,
  AttachmentDto,
  ConversationDto,
  NotificationDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ContactLog } from "@/Interfaces/Auth/UserInterfaces";
import { formatDateTimeNI } from "@/Utils/ECommerce/formatters";
import { store } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { clearCart } from "@/Context/Slices/Ecommerce/cartSlice";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";
const HUB_BASE = API_URL.replace(/\/api\/v1$/, "");

const PORTAL_URL =
  import.meta.env.VITE_PORTAL_URL?.replace(/\/+$/, "");

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

const receiveHandlers = new Map<
  (p: { message: MessageDto; attachments: AttachmentDto[] }) => void,
  (message: MessageDto, attachments?: AttachmentDto[]) => void
>();

const conversationCreatedHandlers = new Map<
  (convo: ConversationDto) => void,
  (convo: ConversationDto) => void
>();

const conversationUpdatedHandlers = new Map<
  (convo: ConversationDto) => void,
  (convo: ConversationDto) => void
>();

const newHumanRequestHandlers = new Map<
  (payload: { conversationId: number; fromPhone: string }) => void,
  (payload: { conversationId: number; fromPhone: string }) => void
>();

const messageStatusChangedHandlers = new Map<
  (msg: MessageDto) => void,
  (msg: MessageDto) => void
>();

const notificationHandlers = new Map<
  (dto: NotificationDto) => void,
  (dto: NotificationDto) => void
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
  (dto: ConversationDto) => void,
  (dto: ConversationDto) => void
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

  //Con unos usuarios se decconecta, y vuelva a reconectar, no pasa con todos,he probado con usuarios de prueba
  //con todos los roles, pero no se descnectan tampoco los de otra clienet
  //pero con otro cliente si pasa 
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

  if (!isRoot) return null;

  if (!activeCompanyId || Number(activeCompanyId) <= 0) return null;

  return Number(activeCompanyId);
}

function shouldStartHubs(): boolean {
  const state = store.getState();

  const isAuthenticated = state.auth?.isAuthenticated;
  const isRoot = state.auth?.isRoot;
  const activeCompanyId = state.company?.activeCompanyId;

  if (!isAuthenticated) return false;

  if (isRoot && (!activeCompanyId || Number(activeCompanyId) <= 0)) {
    return false;
  }

  return true;
}

function buildHubUrl(path: string): string {
  const companyId = getActiveCompanyId();

  if (!companyId) return `${HUB_BASE}${path}`;

  const separator = path.includes("?") ? "&" : "?";

  return `${HUB_BASE}${path}${separator}companyId=${encodeURIComponent(
    String(companyId)
  )}`;
}

function isConnected(connection: signalR.HubConnection | null): boolean {
  return connection?.state === signalR.HubConnectionState.Connected;
}

function clearReconnectTimer() {
  if (!reconnectTimer) return;

  window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function scheduleReconnect() {
  if (isStoppingManually) return;
  if (reconnectTimer) return;
  if (!shouldStartHubs()) return;

  reconnectTimer = window.setTimeout(async () => {
    reconnectTimer = null;

    if (!shouldStartHubs()) return;

    try {
      await restartHubConnection();
    } catch (err) {
      console.warn("[SignalR] Reintento fallido", err);
      scheduleReconnect();
    }
  }, 5000);
}

async function ensureStarted(
  connection: signalR.HubConnection | null
): Promise<void> {
  if (!connection) return;

  if (connection.state === signalR.HubConnectionState.Connected) return;

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
}) {
  window.dispatchEvent(new CustomEvent("DesktopNotify", { detail }));
}

function normalizeSoundDto(payload: unknown): SoundDto {
  const value = payload as Partial<SoundDto>;
  const rawKind = String(value?.kind ?? "message");

  const kind: SoundDto["kind"] =
    rawKind === "new_conversation" || rawKind === "close" || rawKind === "message"
      ? rawKind
      : "message";

  return {
    conversationId: Number(value?.conversationId ?? 0),
    messageId: value?.messageId != null ? Number(value.messageId) : null,
    senderUserId: value?.senderUserId != null ? Number(value.senderUserId) : null,
    senderContactId:
      value?.senderContactId != null ? Number(value.senderContactId) : null,
    kind,
    at: value?.at != null ? String(value.at) : null,
  };
}

function bindConnectionLifecycle(
  connection: signalR.HubConnection,
  name: string,
  onReconnected?: () => void
) {
  connection.onreconnecting((err) => {
    console.warn(`[${name}] Reconectando...`, err);
  });

  connection.onreconnected(() => {
    console.info(`[${name}] Reconectado`);
    onReconnected?.();
  });

  connection.onclose((err) => {
    console.warn(`[${name}] Conexión cerrada`, err);
    scheduleReconnect();
  });
}

function bindNotificationBridgeHandlers(connection: signalR.HubConnection) {
  connection.off("SupportRequested");
  connection.on("SupportRequested", (payload) => {
    window.dispatchEvent(new CustomEvent("SupportRequested", { detail: payload }));
  });

  connection.off("cart:updated");
  connection.on(
    "cart:updated",
    (payload: { contactId: number; orderId: number }) => {
      store.dispatch(
        setContactCartBadge({
          contactId: payload.contactId,
          hasCart: true,
          count:
            store.getState().cartBadge.byContactId?.[payload.contactId]?.count ??
            0,
        })
      );

      const activeContactId = store.getState().cart.activeContactId;

      if (activeContactId === payload.contactId) {
        window.dispatchEvent(
          new CustomEvent("CartReloadForActiveContact", {
            detail: payload,
          })
        );
      }
    }
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
        })
      );

      const activeContactId = store.getState().cart?.activeContactId ?? null;

      if (activeContactId === payload.contactId) {
        store.dispatch(clearCart());

        window.dispatchEvent(
          new CustomEvent("CartClearedForActiveContact", {
            detail: payload,
          })
        );
      }
    }
  );

  connection.off("ConversationAssigned");
  connection.on("ConversationAssigned", (dto: ConversationDto) => {
    window.dispatchEvent(
      new CustomEvent("ConversationAssigned", { detail: dto })
    );
  });

  connection.off("AssignmentResponse");
  connection.on("AssignmentResponse", (payload) => {
    window.dispatchEvent(
      new CustomEvent("AssignmentResponse", { detail: payload })
    );
  });

  connection.off("AssignmentForced");
  connection.on("AssignmentForced", (payload) => {
    window.dispatchEvent(
      new CustomEvent("AssignmentForced", { detail: payload })
    );
  });

  connection.off("AssignmentForcedAdmin");
  connection.on("AssignmentForcedAdmin", (payload) => {
    window.dispatchEvent(
      new CustomEvent("AssignmentForcedAdmin", { detail: payload })
    );
  });

  connection.off("newContactValidation");
  connection.on("newContactValidation", (payload: { contactLog: ContactLog }) => {
    window.dispatchEvent(
      new CustomEvent("newContactValidation", { detail: payload })
    );
  });
}

function bindPresenceHandlers(connection: signalR.HubConnection) {
  connection.off("UserIsOnline");
  connection.on("UserIsOnline", (_userId: number) => {});

  connection.off("UserIsOffline");
  connection.on("UserIsOffline", (_userId: number) => {});
}

function rebindRegisteredHandlers() {
  if (chatConnection) {
    receiveHandlers.forEach((cb) => {
      chatConnection!.off("ReceiveMessage", cb);
      chatConnection!.on("ReceiveMessage", cb);
    });

    conversationCreatedHandlers.forEach((cb) => {
      chatConnection!.off("ConversationCreated", cb);
      chatConnection!.on("ConversationCreated", cb);
    });

    conversationUpdatedHandlers.forEach((cb) => {
      chatConnection!.off("ConversationUpdated", cb);
      chatConnection!.on("ConversationUpdated", cb);
    });
  }

  if (notificationsConnection) {
    newHumanRequestHandlers.forEach((cb) => {
      notificationsConnection!.off("NewHumanRequest", cb);
      notificationsConnection!.on("NewHumanRequest", cb);
    });

    messageStatusChangedHandlers.forEach((cb) => {
      notificationsConnection!.off("MessageStatusChanged", cb);
      notificationsConnection!.on("MessageStatusChanged", cb);
    });

    notificationHandlers.forEach((cb) => {
      notificationsConnection!.off("Notification", cb);
      notificationsConnection!.on("Notification", cb);
    });

    supportRequestedHandlers.forEach((cb) => {
      notificationsConnection!.off("SupportRequested", cb);
      notificationsConnection!.on("SupportRequested", cb);
    });

    receiveAssignmentHandlers.forEach((cb) => {
      notificationsConnection!.off("ConversationAssigned", cb);
      notificationsConnection!.on("ConversationAssigned", cb);
    });

    assignmentResponseHandlers.forEach((cb) => {
      notificationsConnection!.off("AssignmentResponse", cb);
      notificationsConnection!.on("AssignmentResponse", cb);
    });

    assignmentForcedHandlers.forEach((cb) => {
      notificationsConnection!.off("AssignmentForced", cb);
      notificationsConnection!.on("AssignmentForced", cb);
    });

    assignmentForcedAdminHandlers.forEach((cb) => {
      notificationsConnection!.off("AssignmentForcedAdmin", cb);
      notificationsConnection!.on("AssignmentForcedAdmin", cb);
    });

    newContactValidationHandlers.forEach((cb) => {
      notificationsConnection!.off("newContactValidation", cb);
      notificationsConnection!.on("newContactValidation", cb);
    });

    legacyPlaySoundHandlers.forEach((cb) => {
      notificationsConnection!.off("PlayNewMessageSound", cb);
      notificationsConnection!.on("PlayNewMessageSound", cb);
    });

    playSoundHandlers.forEach((cb) => {
      notificationsConnection!.off("PlaySound", cb);
      notificationsConnection!.on("PlaySound", cb);
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

  if (startPromise) return startPromise;

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
      notificationsConnection = buildConnection(buildHubUrl("/hubs/notifications"));

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

      bindConnectionLifecycle(userConeccion, "USER");
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
  } catch (err) {
    scheduleReconnect();
    throw err;
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
      if (!connection) return;
      if (connection.state === signalR.HubConnectionState.Disconnected) return;

      try {
        await connection.stop();
      } catch (err) {
        console.warn("[SignalR] Error al detener conexión", err);
      }
    })
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

export async function joinConversation(conversationId: number) {
  await createHubConnection();

  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    await chatConnection.invoke("JoinConversation", conversationId.toString());
  }
}

export async function leaveConversation(conversationId: number) {
  if (chatConnection?.state !== signalR.HubConnectionState.Connected) return;

  await chatConnection.invoke("LeaveConversation", conversationId.toString());
}

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  if (receiveHandlers.has(handler)) {
    return () => offNewMessage(handler);
  }

  const cb = (message: MessageDto, attachments?: AttachmentDto[]) => {
    try {
      handler({ message, attachments: attachments ?? [] });

      const sentAtText = message?.sentAt ? formatDateTimeNI(message.sentAt) : "";
      const title = `${message?.senderClientName ?? ""} ${
        message?.senderContactName ?? message?.senderUserName ?? ""
      } recibido: ${sentAtText}`;

      const body =
        (message?.content && message.content.trim()) || "(Mensaje con adjunto)";

      emitDesktopNotify({
        title,
        body,
        url: `${PORTAL_URL}/chat/`,
        conversationId: message?.conversationId,
      });
    } catch (err) {
      console.error("Error en onNewMessage:", err);
    }
  };

  receiveHandlers.set(handler, cb);

  if (chatConnection) {
    chatConnection.off("ReceiveMessage", cb);
    chatConnection.on("ReceiveMessage", cb);
  }

  return () => offNewMessage(handler);
}

export function offNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  const stored = receiveHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ReceiveMessage", stored);
  }

  receiveHandlers.delete(handler);
}

export function onConversationCreated(handler: (convo: ConversationDto) => void) {
  if (conversationCreatedHandlers.has(handler)) {
    return () => offConversationCreated(handler);
  }

  const cb = (convo: ConversationDto) => {
    handler(convo);
  };

  conversationCreatedHandlers.set(handler, cb);

  if (chatConnection) {
    chatConnection.off("ConversationCreated", cb);
    chatConnection.on("ConversationCreated", cb);
  }

  return () => offConversationCreated(handler);
}

export function offConversationCreated(handler: (convo: ConversationDto) => void) {
  const stored = conversationCreatedHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ConversationCreated", stored);
  }

  conversationCreatedHandlers.delete(handler);
}

export function onConversationUpdated(handler: (c: ConversationDto) => void) {
  if (conversationUpdatedHandlers.has(handler)) {
    return () => offConversationUpdated(handler);
  }

  const cb = (convo: ConversationDto) => {
    handler(convo);
  };

  conversationUpdatedHandlers.set(handler, cb);

  if (chatConnection) {
    chatConnection.off("ConversationUpdated", cb);
    chatConnection.on("ConversationUpdated", cb);
  }

  return () => offConversationUpdated(handler);
}

export function offConversationUpdated(handler: (c: ConversationDto) => void) {
  const stored = conversationUpdatedHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ConversationUpdated", stored);
  }

  conversationUpdatedHandlers.delete(handler);
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  if (newHumanRequestHandlers.has(handler)) {
    return () => offNewHumanRequest(handler);
  }

  const cb = (payload: { conversationId: number; fromPhone: string }) => {
    handler(payload);
  };

  newHumanRequestHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("NewHumanRequest", cb);
    notificationsConnection.on("NewHumanRequest", cb);
  }

  return () => offNewHumanRequest(handler);
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  const stored = newHumanRequestHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("NewHumanRequest", stored);
  }

  newHumanRequestHandlers.delete(handler);
}

export function onMessageStatusChanged(handler: (msg: MessageDto) => void) {
  if (messageStatusChangedHandlers.has(handler)) {
    return () => offMessageStatusChanged(handler);
  }

  const cb = (msg: MessageDto) => {
    handler(msg);
  };

  messageStatusChangedHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("MessageStatusChanged", cb);
    notificationsConnection.on("MessageStatusChanged", cb);
  }

  return () => offMessageStatusChanged(handler);
}

export function offMessageStatusChanged(handler: (msg: MessageDto) => void) {
  const stored = messageStatusChangedHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("MessageStatusChanged", stored);
  }

  messageStatusChangedHandlers.delete(handler);
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  if (notificationHandlers.has(handler)) {
    return () => offNewNotification(handler);
  }

  const cb = (dto: NotificationDto) => {
    handler(dto);
  };

  notificationHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("Notification", cb);
    notificationsConnection.on("Notification", cb);
  }

  return () => offNewNotification(handler);
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
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
  }) => void
) {
  if (supportRequestedHandlers.has(handler)) {
    return () => offSupportRequested(handler);
  }

  const cb = (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  supportRequestedHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("SupportRequested", cb);
    notificationsConnection.on("SupportRequested", cb);
  }

  return () => offSupportRequested(handler);
}

export function offSupportRequested(
  handler: (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  const stored = supportRequestedHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("SupportRequested", stored);
  }

  supportRequestedHandlers.delete(handler);
}

export function onConversationAssigned(handler: (dto: ConversationDto) => void) {
  if (receiveAssignmentHandlers.has(handler)) {
    return () => offConversationAssigned(handler);
  }

  const cb = (dto: ConversationDto) => {
    try {
      handler(dto);

      emitDesktopNotify({
        title: `Nueva asignación de ${dto?.clientName ?? ""}`,
        body: `Le han asignado una nueva conversación del contacto: ${
          dto?.clientContactName ?? ""
        }`,
        url: `${PORTAL_URL}/chat/`,
        conversationId: dto?.conversationId,
      });
    } catch (err) {
      console.error("[onConversationAssigned] Error:", err);
    }
  };

  receiveAssignmentHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("ConversationAssigned", cb);
    notificationsConnection.on("ConversationAssigned", cb);
  }

  return () => offConversationAssigned(handler);
}

export function offConversationAssigned(handler: (dto: ConversationDto) => void) {
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
  }) => void
) {
  if (assignmentResponseHandlers.has(handler)) {
    return () => offAssignmentResponse(handler);
  }

  const cb = (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  assignmentResponseHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("AssignmentResponse", cb);
    notificationsConnection.on("AssignmentResponse", cb);
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
  }) => void
) {
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
  }) => void
) {
  if (assignmentForcedHandlers.has(handler)) {
    return () => offAssignmentForced(handler);
  }

  const cb = (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  assignmentForcedHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("AssignmentForced", cb);
    notificationsConnection.on("AssignmentForced", cb);
  }

  return () => offAssignmentForced(handler);
}

export function offAssignmentForced(
  handler: (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
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
  }) => void
) {
  if (assignmentForcedAdminHandlers.has(handler)) {
    return () => offAssignmentForcedAdmin(handler);
  }

  const cb = (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => {
    handler(payload);
  };

  assignmentForcedAdminHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("AssignmentForcedAdmin", cb);
    notificationsConnection.on("AssignmentForcedAdmin", cb);
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
  }) => void
) {
  const stored = assignmentForcedAdminHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("AssignmentForcedAdmin", stored);
  }

  assignmentForcedAdminHandlers.delete(handler);
}

export function onNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  if (newContactValidationHandlers.has(handler)) {
    return () => offNewContactValidation(handler);
  }

  const cb = (payload: { contactLog: ContactLog }) => {
    handler(payload);
  };

  newContactValidationHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("newContactValidation", cb);
    notificationsConnection.on("newContactValidation", cb);
  }

  return () => offNewContactValidation(handler);
}

export function offNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  const stored = newContactValidationHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("newContactValidation", stored);
  }

  newContactValidationHandlers.delete(handler);
}

export function offNewContact() {
  notificationsConnection?.off("newContactValidation");
  userConeccion?.off("newContactValidation");
  newContactValidationHandlers.clear();
}

export function onPlayNewMessageSound(handler: (senderUserId: number) => void) {
  if (legacyPlaySoundHandlers.has(handler)) {
    return () => offPlayNewMessageSound(handler);
  }

  const cb = (senderUserId: number) => {
    handler(Number(senderUserId ?? 0));
  };

  legacyPlaySoundHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("PlayNewMessageSound", cb);
    notificationsConnection.on("PlayNewMessageSound", cb);
  }

  return () => offPlayNewMessageSound(handler);
}

export function offPlayNewMessageSound(handler: (senderUserId: number) => void) {
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

  const cb = (payload: unknown) => {
    const dto = normalizeSoundDto(payload);
    handler(dto);
  };

  playSoundHandlers.set(handler, cb);

  if (notificationsConnection) {
    notificationsConnection.off("PlaySound", cb);
    notificationsConnection.on("PlaySound", cb);
  }

  return () => offPlaySound(handler);
}

export function offPlaySound(handler: (dto: SoundDto) => void) {
  const stored = playSoundHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("PlaySound", stored);
  }

  playSoundHandlers.delete(handler);
}

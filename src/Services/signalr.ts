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
  import.meta.env.VITE_PORTAL_URL?.replace(/\/+$/, "") ||
  "https://staging.dsujq9sb48iiw.amplifyapp.com";

let chatConnection: signalR.HubConnection | null = null;
export let notificationsConnection: signalR.HubConnection | null = null;
export let presenceConnection: signalR.HubConnection | null = null;
export let userConeccion: signalR.HubConnection | null = null;

let startPromise: Promise<{
  chatConnection: signalR.HubConnection | null;
  notificationsConnection: signalR.HubConnection | null;
  presenceConnection: signalR.HubConnection | null;
  userConeccion: signalR.HubConnection | null;
}> | null = null;

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

function buildConnection(url: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

function isConnected(connection: signalR.HubConnection | null): boolean {
  return connection?.state === signalR.HubConnectionState.Connected;
}

async function ensureStarted(
  connection: signalR.HubConnection | null
): Promise<void> {
  if (!connection) return;

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
    const maxWaitMs = 15000;
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
    }, 50);
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

  const kind = String(value?.kind ?? "message") as SoundDto["kind"];

  return {
    conversationId: Number(value?.conversationId ?? 0),
    messageId: value?.messageId != null ? Number(value.messageId) : null,
    senderUserId: value?.senderUserId != null ? Number(value.senderUserId) : null,
    senderContactId:
      value?.senderContactId != null ? Number(value.senderContactId) : null,
    kind:
      kind === "new_conversation" || kind === "close" || kind === "message"
        ? kind
        : "message",
    at: value?.at != null ? String(value.at) : null,
  };
}

function bindNotificationBridgeHandlers(connection: signalR.HubConnection) {
  connection.off("SupportRequested");
  connection.on(
    "SupportRequested",
    (payload: {
      conversationId: number;
      requestedAt: string;
      clientContactName: string;
      clientName: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent("SupportRequested", { detail: payload })
      );
    }
  );

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
        })
      );

      const state = store.getState();
      const activeContactId = state.cart.activeContactId;

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

      const state = store.getState();
      const activeContactId = state.cart?.activeContactId ?? null;

      if (activeContactId === payload.contactId) {
        store.dispatch(clearCart());
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
  connection.on(
    "AssignmentResponse",
    (payload: {
      conversationId: number;
      assignedAgentName: string;
      accepted: boolean;
      comment?: string;
      clientContactName: string;
      clientName: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent("AssignmentResponse", { detail: payload })
      );
    }
  );

  connection.off("AssignmentForced");
  connection.on(
    "AssignmentForced",
    (payload: {
      conversationId: number;
      comment: string;
      clientContactName: string;
      clientName: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent("AssignmentForced", { detail: payload })
      );
    }
  );

  connection.off("AssignmentForcedAdmin");
  connection.on(
    "AssignmentForcedAdmin",
    (payload: {
      conversationId: number;
      targetAgentId: number;
      comment: string;
      clientContactName: string;
      clientName: string;
    }) => {
      window.dispatchEvent(
        new CustomEvent("AssignmentForcedAdmin", { detail: payload })
      );
    }
  );

  connection.off("newContactValidation");
  connection.on("newContactValidation", (payload: { contactLog: ContactLog }) => {
    window.dispatchEvent(
      new CustomEvent("newContactValidation", { detail: payload })
    );
  });
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

export async function createHubConnection() {
  if (startPromise) return startPromise;

  startPromise = (async () => {
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
      chatConnection = buildConnection(`${HUB_BASE}/hubs/chat`);

      chatConnection.onreconnecting((err) =>
        console.warn("[CHAT] Reconectando...", err)
      );

      chatConnection.onreconnected(() => {
        rebindRegisteredHandlers();
      });

      chatConnection.onclose((err) => {
        console.warn("[CHAT] Conexión cerrada", err);
      });
    }

    if (!userConeccion) {
      userConeccion = buildConnection(`${HUB_BASE}/hubs/users`);

      userConeccion.onreconnecting((err) =>
        console.warn("[USER] Reconectando...", err)
      );

      userConeccion.onclose((err) => {
        console.warn("[USER] Conexión cerrada", err);
      });
    }

    if (!notificationsConnection) {
      notificationsConnection = buildConnection(`${HUB_BASE}/hubs/notifications`);

      notificationsConnection.onreconnecting((err) =>
        console.warn("[NOTIFICATIONS] Reconectando...", err)
      );

      notificationsConnection.onreconnected(() => {
        bindNotificationBridgeHandlers(notificationsConnection!);
        rebindRegisteredHandlers();
      });

      notificationsConnection.onclose((err) => {
        console.warn("[NOTIFICATIONS] Conexión cerrada", err);
      });

      bindNotificationBridgeHandlers(notificationsConnection);
    }

    if (!presenceConnection) {
      presenceConnection = buildConnection(`${HUB_BASE}/hubs/presence`);

      presenceConnection.off("UserIsOnline");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      presenceConnection.on("UserIsOnline", (_userId: number) => {});

      presenceConnection.off("UserIsOffline");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      presenceConnection.on("UserIsOffline", (_userId: number) => {});

      presenceConnection.onreconnecting((err) =>
        console.warn("[PRESENCE] Reconectando...", err)
      );

      presenceConnection.onclose((err) => {
        console.warn("[PRESENCE] Conexión cerrada", err);
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
  } finally {
    startPromise = null;
  }
}

export async function stopHubConnection(): Promise<void> {
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

      await connection.stop();
    })
  );

  chatConnection = null;
  notificationsConnection = null;
  presenceConnection = null;
  userConeccion = null;
  startPromise = null;
}

export async function joinConversation(conversationId: number) {
  if (!chatConnection || chatConnection.state !== signalR.HubConnectionState.Connected) {
    await createHubConnection();
  }

  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    await chatConnection.invoke("JoinConversation", conversationId.toString());
  }
}

export async function leaveConversation(conversationId: number) {
  if (!chatConnection || chatConnection.state !== signalR.HubConnectionState.Connected) {
    return;
  }

  await chatConnection.invoke("LeaveConversation", conversationId.toString());
}

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  if (!chatConnection) return () => {};

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
  chatConnection.on("ReceiveMessage", cb);

  return () => offNewMessage(handler);
}

export function offNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  const stored = receiveHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ReceiveMessage", stored);
    receiveHandlers.delete(handler);
  }
}

export function onConversationCreated(handler: (convo: ConversationDto) => void) {
  if (!chatConnection) return () => {};

  if (conversationCreatedHandlers.has(handler)) {
    return () => offConversationCreated(handler);
  }

  const cb = (convo: ConversationDto) => {
    handler(convo);
  };

  conversationCreatedHandlers.set(handler, cb);
  chatConnection.on("ConversationCreated", cb);

  return () => offConversationCreated(handler);
}

export function offConversationCreated(handler: (convo: ConversationDto) => void) {
  const stored = conversationCreatedHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ConversationCreated", stored);
    conversationCreatedHandlers.delete(handler);
  }
}

export function onConversationUpdated(handler: (c: ConversationDto) => void) {
  if (!chatConnection) return () => {};

  if (conversationUpdatedHandlers.has(handler)) {
    return () => offConversationUpdated(handler);
  }

  const cb = (convo: ConversationDto) => {
    handler(convo);
  };

  conversationUpdatedHandlers.set(handler, cb);
  chatConnection.on("ConversationUpdated", cb);

  return () => offConversationUpdated(handler);
}

export function offConversationUpdated(handler: (c: ConversationDto) => void) {
  const stored = conversationUpdatedHandlers.get(handler);

  if (stored && chatConnection) {
    chatConnection.off("ConversationUpdated", stored);
    conversationUpdatedHandlers.delete(handler);
  }
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  if (!notificationsConnection) return () => {};

  if (newHumanRequestHandlers.has(handler)) {
    return () => offNewHumanRequest(handler);
  }

  const cb = (payload: { conversationId: number; fromPhone: string }) => {
    handler(payload);
  };

  newHumanRequestHandlers.set(handler, cb);
  notificationsConnection.on("NewHumanRequest", cb);

  return () => offNewHumanRequest(handler);
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  const stored = newHumanRequestHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("NewHumanRequest", stored);
    newHumanRequestHandlers.delete(handler);
  }
}

export function onMessageStatusChanged(handler: (msg: MessageDto) => void) {
  if (!notificationsConnection) return () => {};

  if (messageStatusChangedHandlers.has(handler)) {
    return () => offMessageStatusChanged(handler);
  }

  const cb = (msg: MessageDto) => {
    handler(msg);
  };

  messageStatusChangedHandlers.set(handler, cb);
  notificationsConnection.on("MessageStatusChanged", cb);

  return () => offMessageStatusChanged(handler);
}

export function offMessageStatusChanged(handler: (msg: MessageDto) => void) {
  const stored = messageStatusChangedHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("MessageStatusChanged", stored);
    messageStatusChangedHandlers.delete(handler);
  }
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  if (!notificationsConnection) return () => {};

  if (notificationHandlers.has(handler)) {
    return () => offNewNotification(handler);
  }

  const cb = (dto: NotificationDto) => {
    handler(dto);
  };

  notificationHandlers.set(handler, cb);
  notificationsConnection.on("Notification", cb);

  return () => offNewNotification(handler);
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
  const stored = notificationHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("Notification", stored);
    notificationHandlers.delete(handler);
  }
}

export function onSupportRequested(
  handler: (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  if (!notificationsConnection) return () => {};

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
  notificationsConnection.on("SupportRequested", cb);

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
    supportRequestedHandlers.delete(handler);
  }
}

export function onConversationAssigned(handler: (dto: ConversationDto) => void) {
  if (!notificationsConnection) return () => {};

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
  notificationsConnection.on("ConversationAssigned", cb);

  return () => offConversationAssigned(handler);
}

export function offConversationAssigned(handler: (dto: ConversationDto) => void) {
  const stored = receiveAssignmentHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("ConversationAssigned", stored);
    receiveAssignmentHandlers.delete(handler);
  }
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
  if (!notificationsConnection) return () => {};

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
  notificationsConnection.on("AssignmentResponse", cb);

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
    assignmentResponseHandlers.delete(handler);
  }
}

export function onAssignmentForced(
  handler: (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  if (!notificationsConnection) return () => {};

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
  notificationsConnection.on("AssignmentForced", cb);

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
    assignmentForcedHandlers.delete(handler);
  }
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
  if (!notificationsConnection) return () => {};

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
  notificationsConnection.on("AssignmentForcedAdmin", cb);

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
    assignmentForcedAdminHandlers.delete(handler);
  }
}

export function onNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  if (!notificationsConnection) return () => {};

  if (newContactValidationHandlers.has(handler)) {
    return () => offNewContactValidation(handler);
  }

  const cb = (payload: { contactLog: ContactLog }) => {
    handler(payload);
  };

  newContactValidationHandlers.set(handler, cb);
  notificationsConnection.on("newContactValidation", cb);

  return () => offNewContactValidation(handler);
}

export function offNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  const stored = newContactValidationHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("newContactValidation", stored);
    newContactValidationHandlers.delete(handler);
  }
}

export function offNewContact() {
  notificationsConnection?.off("newContactValidation");
  userConeccion?.off("newContactValidation");
}

export function onPlayNewMessageSound(handler: (senderUserId: number) => void) {
  if (!notificationsConnection) return () => {};

  if (legacyPlaySoundHandlers.has(handler)) {
    return () => offPlayNewMessageSound(handler);
  }

  const cb = (senderUserId: number) => {
    handler(Number(senderUserId ?? 0));
  };

  legacyPlaySoundHandlers.set(handler, cb);
  notificationsConnection.on("PlayNewMessageSound", cb);

  return () => offPlayNewMessageSound(handler);
}

export function offPlayNewMessageSound(handler: (senderUserId: number) => void) {
  const stored = legacyPlaySoundHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("PlayNewMessageSound", stored);
    legacyPlaySoundHandlers.delete(handler);
  }
}

export function onPlaySound(handler: (dto: SoundDto) => void) {
  if (!notificationsConnection) return () => {};

  if (playSoundHandlers.has(handler)) {
    return () => offPlaySound(handler);
  }

  const cb = (payload: unknown) => {
    const dto = normalizeSoundDto(payload);
    handler(dto);
  };

  playSoundHandlers.set(handler, cb);
  notificationsConnection.on("PlaySound", cb);

  return () => offPlaySound(handler);
}

export function offPlaySound(handler: (dto: SoundDto) => void) {
  const stored = playSoundHandlers.get(handler);

  if (stored && notificationsConnection) {
    notificationsConnection.off("PlaySound", stored);
    playSoundHandlers.delete(handler);
  }
}
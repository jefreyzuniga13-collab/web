/* eslint-disable @typescript-eslint/no-explicit-any */
import * as signalR from "@microsoft/signalr";
import type {
  MessageDto,
  AttachmentDto,
  ConversationDto,
  NotificationDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ContactLog } from "@/Interfaces/Auth/UserInterfaces";
import { notificationSound } from "@/Utils/sound";
import { formatDateTimeNI } from "@/Utils/ECommerce/formatters";
import { store } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { clearCart } from "@/Context/Slices/Ecommerce/cartSlice";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ??
  "https://crmpcg.com/api/v1";

const HUB_BASE = API_URL.replace(/\/api\/v1$/, "");

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

function buildConnection(url: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}

async function ensureStarted(connection: signalR.HubConnection | null): Promise<void> {
  if (!connection) return;
  if (connection.state === signalR.HubConnectionState.Connected) return;
  if (connection.state === signalR.HubConnectionState.Connecting) return;
  if (connection.state === signalR.HubConnectionState.Reconnecting) return;
  await connection.start();
}

export async function createHubConnection() {
  if (startPromise) return startPromise;

  if (!chatConnection) {
    chatConnection = buildConnection(`${HUB_BASE}/hubs/chat`);

    chatConnection.onreconnecting((err) => console.warn("Reconnecting to Chat Hub...", err));
    chatConnection.onreconnected(() => console.info("Reconnected to Chat Hub"));
    chatConnection.onclose((err) => {
      console.info("Coneccion cerrada", err);
    });
  }

  if (!userConeccion) {
    userConeccion = buildConnection(`${HUB_BASE}/hubs/users`);

    userConeccion.onreconnecting((err) => console.warn("Reconnecting to User Hub...", err));
    userConeccion.onreconnected(() => console.info("Reconnected to User Chat Hub"));
    userConeccion.onclose((err) => {
      console.info("Coneccion cerrada", err);
    });
  }

  if (!notificationsConnection) {
    notificationsConnection = buildConnection(`${HUB_BASE}/hubs/notifications`);

    notificationsConnection.onreconnecting((err) =>
      console.warn("Reconnecting to Notifications Hub...", err)
    );

    notificationsConnection.onreconnected(() =>
      console.info("Reconnected to Notifications Hub")
    );

    notificationsConnection.onclose((err) => console.info("Coneccion cerrada", err));

    notificationsConnection.off("SupportRequested");
    notificationsConnection.on(
      "SupportRequested",
      (payload: {
        conversationId: number;
        requestedAt: string;
        clientContactName: string;
        clientName: string;
      }) => {
        window.dispatchEvent(new CustomEvent("SupportRequested", { detail: payload }));
      }
    );

    notificationsConnection.off("cart:updated");
    notificationsConnection.on(
      "cart:updated",
      async (payload: { contactId: number; orderId: number }) => {
        store.dispatch(
          setContactCartBadge({
            contactId: payload.contactId,
            hasCart: true,
            count: store.getState().cartBadge.byContactId?.[payload.contactId]?.count ?? 0,
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

    notificationsConnection.off("cart:cleared");
    notificationsConnection.on(
      "cart:cleared",
      (payload: { contactId: number; orderId: number; conversationId: number }) => {
        try {
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
        } catch (err) {
          console.error("[cart:cleared] Error procesando evento", err);
        }
      }
    );

    notificationsConnection.off("ConversationAssigned");
    notificationsConnection.on("ConversationAssigned", (dto: ConversationDto) => {
      window.dispatchEvent(new CustomEvent("ConversationAssigned", { detail: dto }));
    });

    notificationsConnection.off("AssignmentResponse");
    notificationsConnection.on(
      "AssignmentResponse",
      (payload: {
        conversationId: number;
        assignedAgentName: string;
        accepted: boolean;
        comment?: string;
        clientContactName: string;
        clientName: string;
      }) => {
        window.dispatchEvent(new CustomEvent("AssignmentResponse", { detail: payload }));
      }
    );

    notificationsConnection.off("AssignmentForced");
    notificationsConnection.on(
      "AssignmentForced",
      (payload: {
        conversationId: number;
        comment: string;
        clientContactName: string;
        clientName: string;
      }) => {
        window.dispatchEvent(new CustomEvent("AssignmentForced", { detail: payload }));
      }
    );

    notificationsConnection.off("AssignmentForcedAdmin");
    notificationsConnection.on(
      "AssignmentForcedAdmin",
      (payload: {
        conversationId: number;
        targetAgentId: number;
        comment: string;
        clientContactName: string;
        clientName: string;
      }) => {
        window.dispatchEvent(new CustomEvent("AssignmentForcedAdmin", { detail: payload }));
      }
    );

    notificationsConnection.off("offNewContactValidation");
    notificationsConnection.on("offNewContactValidation", (payload: { contactLog: ContactLog }) => {
      window.dispatchEvent(new CustomEvent("newContactValidation", { detail: payload }));
    });
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
      console.warn("Reconnecting to Presence Hub...", err)
    );
    presenceConnection.onreconnected(() =>
      console.info("Reconnected to Presence Hub")
    );
    presenceConnection.onclose((err) =>
      console.warn("Presence Hub connection closed", err)
    );
  }

  startPromise = Promise.all([
    ensureStarted(chatConnection),
    ensureStarted(notificationsConnection),
    ensureStarted(presenceConnection),
    ensureStarted(userConeccion),
  ])
    .then(() => ({
      chatConnection,
      notificationsConnection,
      presenceConnection,
      userConeccion,
    }))
    .catch((error) => {
      console.info("Coneccion cerrada", error);
      throw error;
    })
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
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

const receiveHandlers = new Map<
  (p: { message: MessageDto; attachments: AttachmentDto[] }) => void,
  (message: MessageDto, attachments?: AttachmentDto[]) => void
>();

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  if (!chatConnection) return () => {};

  if (receiveHandlers.has(handler)) {
    return () => {
      const cb = receiveHandlers.get(handler)!;
      chatConnection!.off("ReceiveMessage", cb);
      receiveHandlers.delete(handler);
    };
  }

  const cb = (message: MessageDto, attachments?: AttachmentDto[]) => {
    try {
      handler({ message, attachments: attachments ?? [] });

      const sentAtText = message?.sentAt ? formatDateTimeNI(message.sentAt) : "";

      const title = `${message?.senderClientName ?? ""} ${
        message?.senderContactName ?? message?.senderUserName ?? ""
      } recibido: ${sentAtText}`;
      const body = (message?.content && message.content.trim()) || "(Mensaje con adjunto)";
      const url = `https://staging.dsujq9sb48iiw.amplifyapp.com/chat/`;

      window.dispatchEvent(
        new CustomEvent("DesktopNotify", {
          detail: { title, body, url, conversationId: message?.conversationId },
        })
      );
    } catch (err) {
      console.error("Error en onNewMessage:", err);
    }
  };

  receiveHandlers.set(handler, cb);
  chatConnection.on("ReceiveMessage", cb);

  return () => {
    const stored = receiveHandlers.get(handler);
    if (stored) {
      chatConnection!.off("ReceiveMessage", stored);
      receiveHandlers.delete(handler);
    }
  };
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

export function offNewContact() {
  userConeccion?.off("newContactValidation");
}

export function onConversationCreated(handler: (convo: ConversationDto) => void) {
  chatConnection?.on("ConversationCreated", handler);
}

export function offConversationCreated(handler: (convo: ConversationDto) => void) {
  chatConnection?.off("ConversationCreated", handler);
}

export function onConversationUpdated(handler: (c: ConversationDto) => void) {
  chatConnection?.on("ConversationUpdated", handler);
}

export function offConversationUpdated(handler: (c: ConversationDto) => void) {
  chatConnection?.off("ConversationUpdated", handler);
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.on("NewHumanRequest", handler);
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.off("NewHumanRequest", handler);
}

export function onMessageStatusChanged(handler: (msg: MessageDto) => void) {
  notificationsConnection?.on("MessageStatusChanged", handler);
}

export function offMessageStatusChanged(handler: (msg: MessageDto) => void) {
  notificationsConnection?.off("MessageStatusChanged", handler);
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  notificationsConnection?.on("Notification", handler);
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
  notificationsConnection?.off("Notification", handler);
}

export function onSupportRequested(
  handler: (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  notificationsConnection?.on("SupportRequested", handler);
}

export function offSupportRequested(
  handler: (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  notificationsConnection?.off("SupportRequested", handler);
}

const receiveAssignmentHandlers = new Map<
  (dto: ConversationDto) => void,
  (dto: ConversationDto) => void
>();

export function onConversationAssigned(handler: (dto: ConversationDto) => void) {
  if (!notificationsConnection) {
    console.warn("[onConversationAssigned] notificationsConnection es null. ¿Llamaste createHubConnection()?");
    return () => {};
  }

  if (receiveAssignmentHandlers.has(handler)) {
    return () => {
      const cb = receiveAssignmentHandlers.get(handler)!;
      notificationsConnection!.off("ConversationAssigned", cb);
      receiveAssignmentHandlers.delete(handler);
    };
  }

  const cb = (dto: ConversationDto) => {
    try {
      handler(dto);

      const title = `Nueva asignación de ${dto?.clientName ?? ""}`;
      const body = `Le han asignado una nueva conversación del contacto: ${dto?.clientContactName ?? ""}`;
      const url = `https://staging.dsujq9sb48iiw.amplifyapp.com/chat/`;

      window.dispatchEvent(
        new CustomEvent("DesktopNotify", {
          detail: { title, body, url, conversationId: dto?.conversationId },
        })
      );
    } catch (err) {
      console.error("[onConversationAssigned] Error en callback:", err);
    }
  };

  receiveAssignmentHandlers.set(handler, cb);

  const subscribe = () => {
    notificationsConnection!.off("ConversationAssigned", cb);
    notificationsConnection!.on("ConversationAssigned", cb);
  };

  if (notificationsConnection.state === signalR.HubConnectionState.Connected) {
    subscribe();
  } else {
    console.warn("[onConversationAssigned] Conexión no conectada aún. Estado:", notificationsConnection.state);
    subscribe();

    notificationsConnection.onreconnected(() => {
      subscribe();
    });
  }

  return () => {
    const stored = receiveAssignmentHandlers.get(handler);
    if (stored) {
      notificationsConnection!.off("ConversationAssigned", stored);
      receiveAssignmentHandlers.delete(handler);
    }
  };
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
  notificationsConnection?.on("AssignmentResponse", handler);
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
  notificationsConnection?.off("AssignmentResponse", handler);
}

export function onAssignmentForced(
  handler: (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  notificationsConnection?.on("AssignmentForced", handler);
}

export function offAssignmentForced(
  handler: (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => void
) {
  notificationsConnection?.off("AssignmentForced", handler);
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
  notificationsConnection?.on("AssignmentForcedAdmin", handler);
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
  notificationsConnection?.off("AssignmentForcedAdmin", handler);
}

export function onNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  notificationsConnection?.on("newContactValidation", handler);
  notificationSound.play();
}

export function offNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  notificationsConnection?.off("newContactValidation", handler);
}

export function onPlayNewMessageSound(
  handler: (senderUserId: number) => void
) {
  notificationsConnection?.on("PlayNewMessageSound", (senderUserId: any) => {
    handler(Number(senderUserId));
  });
}

export function offPlayNewMessageSound() {
  notificationsConnection?.off("PlayNewMessageSound");
}
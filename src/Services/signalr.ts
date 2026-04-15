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
  console.log("[SIGNALR] buildConnection", { url });

  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}

async function ensureStarted(connection: signalR.HubConnection | null, name: string): Promise<void> {
  if (!connection) {
    console.warn("[SIGNALR] ensureStarted sin conexión", { name });
    return;
  }

  console.log("[SIGNALR] ensureStarted", {
    name,
    state: connection.state,
  });

  if (connection.state === signalR.HubConnectionState.Connected) return;
  if (connection.state === signalR.HubConnectionState.Connecting) return;
  if (connection.state === signalR.HubConnectionState.Reconnecting) return;

  await connection.start();

  console.log("[SIGNALR] started", {
    name,
    state: connection.state,
    connectionId: connection.connectionId,
  });
}

function emitDesktopNotify(detail: {
  title: string;
  body: string;
  url: string;
  conversationId?: number;
}) {
  console.log("[SIGNALR] DesktopNotify", detail);
  window.dispatchEvent(new CustomEvent("DesktopNotify", { detail }));
}

function bindNotificationBridgeHandlers(connection: signalR.HubConnection) {
  console.log("[SIGNALR] bindNotificationBridgeHandlers");

  connection.off("SupportRequested");
  connection.on(
    "SupportRequested",
    (payload: {
      conversationId: number;
      requestedAt: string;
      clientContactName: string;
      clientName: string;
    }) => {
      console.log("[EVENT SupportRequested bridge]", payload);
      window.dispatchEvent(new CustomEvent("SupportRequested", { detail: payload }));
    }
  );

  connection.off("cart:updated");
  connection.on(
    "cart:updated",
    (payload: { contactId: number; orderId: number }) => {
      console.log("[EVENT cart:updated bridge]", payload);

      store.dispatch(
        setContactCartBadge({
          contactId: payload.contactId,
          hasCart: true,
          count:
            store.getState().cartBadge.byContactId?.[payload.contactId]?.count ?? 0,
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
  // connection.on(
  //   "cart:cleared",
  //   (payload: { contactId: number; orderId: number; conversationId: number }) => {
  //     // console.log("[EVENT cart:cleared bridge]", payload);
  //     const draftKey = `cartDraft:v1:${conversationId}:${contactId}`;

  //     localStorage.removeItem(draftKey)
      
  //     try {
  //       store.dispatch(
  //         setContactCartBadge({
  //           contactId: payload.contactId,
  //           hasCart: false,
  //           count: 0,
  //         })
  //       );

  //       const state = store.getState();
  //       const activeContactId = state.cart?.activeContactId ?? null;

  //       if (activeContactId === payload.contactId) {
  //         store.dispatch(clearCart());
  //       }
  //     } catch (err) {
  //       console.error("[cart:cleared] Error procesando evento", err);
  //     }
  //   }
  // );
        connection.on(
        "cart:cleared",
        (payload: { contactId: number; orderId: number; conversationId: number }) => {
          const draftKey = `cartDraft:v1:${payload.conversationId}:${payload.contactId}`;

          localStorage.removeItem(draftKey);

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

  connection.off("ConversationAssigned");
  connection.on("ConversationAssigned", (dto: ConversationDto) => {
    console.log("[EVENT ConversationAssigned bridge]", dto);
    window.dispatchEvent(new CustomEvent("ConversationAssigned", { detail: dto }));
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
      console.log("[EVENT AssignmentResponse bridge]", payload);
      window.dispatchEvent(new CustomEvent("AssignmentResponse", { detail: payload }));
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
      console.log("[EVENT AssignmentForced bridge]", payload);
      window.dispatchEvent(new CustomEvent("AssignmentForced", { detail: payload }));
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
      console.log("[EVENT AssignmentForcedAdmin bridge]", payload);
      window.dispatchEvent(new CustomEvent("AssignmentForcedAdmin", { detail: payload }));
    }
  );

  connection.off("newContactValidation");
  connection.on("newContactValidation", (payload: { contactLog: ContactLog }) => {
    console.log("[EVENT newContactValidation bridge]", payload);
    window.dispatchEvent(new CustomEvent("newContactValidation", { detail: payload }));
  });
}

export async function createHubConnection() {
  console.log("[SIGNALR] createHubConnection called", {
    hasStartPromise: !!startPromise,
    chat: chatConnection?.state,
    notifications: notificationsConnection?.state,
    presence: presenceConnection?.state,
    user: userConeccion?.state,
  });

  if (startPromise) return startPromise;

  if (!chatConnection) {
    chatConnection = buildConnection(`${HUB_BASE}/hubs/chat`);

    chatConnection.onreconnecting((err) =>
      console.warn("[CHAT] reconnecting", err)
    );
    chatConnection.onreconnected((connectionId) =>
      console.info("[CHAT] reconnected", { connectionId, state: chatConnection?.state })
    );
    chatConnection.onclose((err) => {
      console.info("[CHAT] closed", err);
    });
  }

  if (!userConeccion) {
    userConeccion = buildConnection(`${HUB_BASE}/hubs/users`);

    userConeccion.onreconnecting((err) =>
      console.warn("[USER] reconnecting", err)
    );
    userConeccion.onreconnected((connectionId) =>
      console.info("[USER] reconnected", { connectionId, state: userConeccion?.state })
    );
    userConeccion.onclose((err) => {
      console.info("[USER] closed", err);
    });
  }

  if (!notificationsConnection) {
    notificationsConnection = buildConnection(`${HUB_BASE}/hubs/notifications`);

    notificationsConnection.onreconnecting((err) =>
      console.warn("[NOTI] reconnecting", err)
    );

    notificationsConnection.onreconnected((connectionId) => {
      console.info("[NOTI] reconnected", {
        connectionId,
        state: notificationsConnection?.state,
      });
      bindNotificationBridgeHandlers(notificationsConnection!);
      rebindRegisteredHandlers();
    });

    notificationsConnection.onclose((err) =>
      console.info("[NOTI] closed", err)
    );

    bindNotificationBridgeHandlers(notificationsConnection);
  }

  if (!presenceConnection) {
    presenceConnection = buildConnection(`${HUB_BASE}/hubs/presence`);

    presenceConnection.off("UserIsOnline");
    presenceConnection.on("UserIsOnline", (_userId: number) => {
      console.log("[EVENT UserIsOnline bridge]", { userId: _userId });
    });

    presenceConnection.off("UserIsOffline");
    presenceConnection.on("UserIsOffline", (_userId: number) => {
      console.log("[EVENT UserIsOffline bridge]", { userId: _userId });
    });

    presenceConnection.onreconnecting((err) =>
      console.warn("[PRESENCE] reconnecting", err)
    );
    presenceConnection.onreconnected((connectionId) =>
      console.info("[PRESENCE] reconnected", {
        connectionId,
        state: presenceConnection?.state,
      })
    );
    presenceConnection.onclose((err) =>
      console.warn("[PRESENCE] closed", err)
    );
  }

  startPromise = Promise.all([
    ensureStarted(chatConnection, "chat"),
    ensureStarted(notificationsConnection, "notifications"),
    ensureStarted(presenceConnection, "presence"),
    ensureStarted(userConeccion, "user"),
  ])
    .then(() => {
      rebindRegisteredHandlers();

      console.log("[SIGNALR] all started", {
        chat: chatConnection?.state,
        notifications: notificationsConnection?.state,
        presence: presenceConnection?.state,
        user: userConeccion?.state,
        chatConnectionId: chatConnection?.connectionId,
        notificationsConnectionId: notificationsConnection?.connectionId,
        presenceConnectionId: presenceConnection?.connectionId,
        userConnectionId: userConeccion?.connectionId,
      });

      return {
        chatConnection,
        notificationsConnection,
        presenceConnection,
        userConeccion,
      };
    })
    .catch((error) => {
      console.info("[SIGNALR] createHubConnection error", error);
      throw error;
    })
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
}

export async function stopHubConnection(): Promise<void> {
  console.log("[SIGNALR] stopHubConnection called");

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

      console.log("[SIGNALR] stopping", {
        connectionId: connection.connectionId,
        state: connection.state,
      });

      await connection.stop();
    })
  );

  chatConnection = null;
  notificationsConnection = null;
  presenceConnection = null;
  userConeccion = null;

  console.log("[SIGNALR] all stopped");
}

export async function joinConversation(conversationId: number) {
  console.log("[SIGNALR] joinConversation called", {
    conversationId,
    chatState: chatConnection?.state,
  });

  if (!chatConnection || chatConnection.state !== signalR.HubConnectionState.Connected) {
    await createHubConnection();
  }

  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    await chatConnection.invoke("JoinConversation", conversationId.toString());
    console.log("[SIGNALR] JoinConversation invoked", { conversationId });
  } else {
    console.warn("[SIGNALR] JoinConversation no conectado", {
      conversationId,
      chatState: chatConnection?.state,
    });
  }
}

export async function leaveConversation(conversationId: number) {
  console.log("[SIGNALR] leaveConversation called", {
    conversationId,
    chatState: chatConnection?.state,
  });

  if (!chatConnection || chatConnection.state !== signalR.HubConnectionState.Connected) {
    return;
  }

  await chatConnection.invoke("LeaveConversation", conversationId.toString());
  console.log("[SIGNALR] LeaveConversation invoked", { conversationId });
}

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

const playSoundHandlers = new Map<
  (senderUserId: number) => void,
  (senderUserId: number) => void
>();

function rebindRegisteredHandlers() {
  console.log("[SIGNALR] rebindRegisteredHandlers", {
    receiveHandlers: receiveHandlers.size,
    conversationCreatedHandlers: conversationCreatedHandlers.size,
    conversationUpdatedHandlers: conversationUpdatedHandlers.size,
    newHumanRequestHandlers: newHumanRequestHandlers.size,
    messageStatusChangedHandlers: messageStatusChangedHandlers.size,
    notificationHandlers: notificationHandlers.size,
    supportRequestedHandlers: supportRequestedHandlers.size,
    receiveAssignmentHandlers: receiveAssignmentHandlers.size,
    assignmentResponseHandlers: assignmentResponseHandlers.size,
    assignmentForcedHandlers: assignmentForcedHandlers.size,
    assignmentForcedAdminHandlers: assignmentForcedAdminHandlers.size,
    newContactValidationHandlers: newContactValidationHandlers.size,
    playSoundHandlers: playSoundHandlers.size,
  });

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

    playSoundHandlers.forEach((cb) => {
      notificationsConnection!.off("PlayNewMessageSound", cb);
      notificationsConnection!.on("PlayNewMessageSound", cb);
    });
  }
}

export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  if (!chatConnection) {
    console.warn("[SIGNALR] onNewMessage sin chatConnection");
    return () => {};
  }

  if (receiveHandlers.has(handler)) {
    console.log("[SIGNALR] onNewMessage ya registrado");
    return () => {
      const cb = receiveHandlers.get(handler)!;
      chatConnection!.off("ReceiveMessage", cb);
      receiveHandlers.delete(handler);
    };
  }

  const cb = (message: MessageDto, attachments?: AttachmentDto[]) => {
    try {
      console.log("[EVENT ReceiveMessage]", { message, attachments });

      handler({ message, attachments: attachments ?? [] });

      const sentAtText = message?.sentAt ? formatDateTimeNI(message.sentAt) : "";
      const title = `${message?.senderClientName ?? ""} ${
        message?.senderContactName ?? message?.senderUserName ?? ""
      } recibido: ${sentAtText}`;
      const body = (message?.content && message.content.trim()) || "(Mensaje con adjunto)";
      const url = `https://staging.dsujq9sb48iiw.amplifyapp.com/chat/`;

      emitDesktopNotify({
        title,
        body,
        url,
        conversationId: message?.conversationId,
      });
    } catch (err) {
      console.error("Error en onNewMessage:", err);
    }
  };

  console.log("[SIGNALR] registering ReceiveMessage handler");
  receiveHandlers.set(handler, cb);
  chatConnection.on("ReceiveMessage", cb);

  return () => {
    const stored = receiveHandlers.get(handler);
    if (stored && chatConnection) {
      console.log("[SIGNALR] cleanup ReceiveMessage handler");
      chatConnection.off("ReceiveMessage", stored);
      receiveHandlers.delete(handler);
    }
  };
}

export function offNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  const stored = receiveHandlers.get(handler);
  if (stored && chatConnection) {
    console.log("[SIGNALR] offNewMessage");
    chatConnection.off("ReceiveMessage", stored);
    receiveHandlers.delete(handler);
  }
}

export function offNewContact() {
  console.log("[SIGNALR] offNewContact");
  userConeccion?.off("newContactValidation");
}

export function onConversationCreated(handler: (convo: ConversationDto) => void) {
  if (!chatConnection) {
    console.warn("[SIGNALR] onConversationCreated sin chatConnection");
    return () => {};
  }

  if (conversationCreatedHandlers.has(handler)) {
    console.log("[SIGNALR] onConversationCreated ya registrado");
    return () => {
      const cb = conversationCreatedHandlers.get(handler)!;
      chatConnection!.off("ConversationCreated", cb);
      conversationCreatedHandlers.delete(handler);
    };
  }

  const cb = (convo: ConversationDto) => {
    console.log("[EVENT ConversationCreated]", convo);
    handler(convo);
  };

  console.log("[SIGNALR] registering ConversationCreated handler");
  conversationCreatedHandlers.set(handler, cb);
  chatConnection.on("ConversationCreated", cb);

  return () => {
    const stored = conversationCreatedHandlers.get(handler);
    if (stored && chatConnection) {
      console.log("[SIGNALR] cleanup ConversationCreated handler");
      chatConnection.off("ConversationCreated", stored);
      conversationCreatedHandlers.delete(handler);
    }
  };
}

export function offConversationCreated(handler: (convo: ConversationDto) => void) {
  const stored = conversationCreatedHandlers.get(handler);
  if (stored && chatConnection) {
    console.log("[SIGNALR] offConversationCreated");
    chatConnection.off("ConversationCreated", stored);
    conversationCreatedHandlers.delete(handler);
  }
}

export function onConversationUpdated(handler: (c: ConversationDto) => void) {
  if (!chatConnection) {
    console.warn("[SIGNALR] onConversationUpdated sin chatConnection");
    return () => {};
  }

  if (conversationUpdatedHandlers.has(handler)) {
    console.log("[SIGNALR] onConversationUpdated ya registrado");
    return () => {
      const cb = conversationUpdatedHandlers.get(handler)!;
      chatConnection!.off("ConversationUpdated", cb);
      conversationUpdatedHandlers.delete(handler);
    };
  }

  const cb = (convo: ConversationDto) => {
    console.log("[EVENT ConversationUpdated]", convo);
    handler(convo);
  };

  console.log("[SIGNALR] registering ConversationUpdated handler");
  conversationUpdatedHandlers.set(handler, cb);
  chatConnection.on("ConversationUpdated", cb);

  return () => {
    const stored = conversationUpdatedHandlers.get(handler);
    if (stored && chatConnection) {
      console.log("[SIGNALR] cleanup ConversationUpdated handler");
      chatConnection.off("ConversationUpdated", stored);
      conversationUpdatedHandlers.delete(handler);
    }
  };
}

export function offConversationUpdated(handler: (c: ConversationDto) => void) {
  const stored = conversationUpdatedHandlers.get(handler);
  if (stored && chatConnection) {
    console.log("[SIGNALR] offConversationUpdated");
    chatConnection.off("ConversationUpdated", stored);
    conversationUpdatedHandlers.delete(handler);
  }
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onNewHumanRequest sin notificationsConnection");
    return () => {};
  }

  if (newHumanRequestHandlers.has(handler)) {
    console.log("[SIGNALR] onNewHumanRequest ya registrado");
    return () => {
      const cb = newHumanRequestHandlers.get(handler)!;
      notificationsConnection!.off("NewHumanRequest", cb);
      newHumanRequestHandlers.delete(handler);
    };
  }

  const cb = (payload: { conversationId: number; fromPhone: string }) => {
    console.log("[EVENT NewHumanRequest]", payload);
    handler(payload);
  };

  console.log("[SIGNALR] registering NewHumanRequest handler");
  newHumanRequestHandlers.set(handler, cb);
  notificationsConnection.on("NewHumanRequest", cb);

  return () => {
    const stored = newHumanRequestHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup NewHumanRequest handler");
      notificationsConnection.off("NewHumanRequest", stored);
      newHumanRequestHandlers.delete(handler);
    }
  };
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  const stored = newHumanRequestHandlers.get(handler);
  if (stored && notificationsConnection) {
    console.log("[SIGNALR] offNewHumanRequest");
    notificationsConnection.off("NewHumanRequest", stored);
    newHumanRequestHandlers.delete(handler);
  }
}

export function onMessageStatusChanged(handler: (msg: MessageDto) => void) {
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onMessageStatusChanged sin notificationsConnection");
    return () => {};
  }

  if (messageStatusChangedHandlers.has(handler)) {
    console.log("[SIGNALR] onMessageStatusChanged ya registrado");
    return () => {
      const cb = messageStatusChangedHandlers.get(handler)!;
      notificationsConnection!.off("MessageStatusChanged", cb);
      messageStatusChangedHandlers.delete(handler);
    };
  }

  const cb = (msg: MessageDto) => {
    console.log("[EVENT MessageStatusChanged]", msg);
    handler(msg);
  };

  console.log("[SIGNALR] registering MessageStatusChanged handler");
  messageStatusChangedHandlers.set(handler, cb);
  notificationsConnection.on("MessageStatusChanged", cb);

  return () => {
    const stored = messageStatusChangedHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup MessageStatusChanged handler");
      notificationsConnection.off("MessageStatusChanged", stored);
      messageStatusChangedHandlers.delete(handler);
    }
  };
}

export function offMessageStatusChanged(handler: (msg: MessageDto) => void) {
  const stored = messageStatusChangedHandlers.get(handler);
  if (stored && notificationsConnection) {
    console.log("[SIGNALR] offMessageStatusChanged");
    notificationsConnection.off("MessageStatusChanged", stored);
    messageStatusChangedHandlers.delete(handler);
  }
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onNewNotification sin notificationsConnection");
    return () => {};
  }

  if (notificationHandlers.has(handler)) {
    console.log("[SIGNALR] onNewNotification ya registrado");
    return () => {
      const cb = notificationHandlers.get(handler)!;
      notificationsConnection!.off("Notification", cb);
      notificationHandlers.delete(handler);
    };
  }

  const cb = (dto: NotificationDto) => {
    console.log("[EVENT Notification]", dto);
    handler(dto);
  };

  console.log("[SIGNALR] registering Notification handler");
  notificationHandlers.set(handler, cb);
  notificationsConnection.on("Notification", cb);

  return () => {
    const stored = notificationHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup Notification handler");
      notificationsConnection.off("Notification", stored);
      notificationHandlers.delete(handler);
    }
  };
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
  const stored = notificationHandlers.get(handler);
  if (stored && notificationsConnection) {
    console.log("[SIGNALR] offNewNotification");
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
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onSupportRequested sin notificationsConnection");
    return () => {};
  }

  if (supportRequestedHandlers.has(handler)) {
    console.log("[SIGNALR] onSupportRequested ya registrado");
    return () => {
      const cb = supportRequestedHandlers.get(handler)!;
      notificationsConnection!.off("SupportRequested", cb);
      supportRequestedHandlers.delete(handler);
    };
  }

  const cb = (payload: {
    conversationId: number;
    requestedAt: string;
    clientContactName: string;
    clientName: string;
  }) => {
    console.log("[EVENT SupportRequested direct]", payload);
    handler(payload);
  };

  console.log("[SIGNALR] registering SupportRequested handler");
  supportRequestedHandlers.set(handler, cb);
  notificationsConnection.on("SupportRequested", cb);

  return () => {
    const stored = supportRequestedHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup SupportRequested handler");
      notificationsConnection.off("SupportRequested", stored);
      supportRequestedHandlers.delete(handler);
    }
  };
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
    console.log("[SIGNALR] offSupportRequested");
    notificationsConnection.off("SupportRequested", stored);
    supportRequestedHandlers.delete(handler);
  }
}

export function onConversationAssigned(handler: (dto: ConversationDto) => void) {
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onConversationAssigned sin notificationsConnection");
    return () => {};
  }

  if (receiveAssignmentHandlers.has(handler)) {
    console.log("[SIGNALR] onConversationAssigned ya registrado");
    return () => {
      const cb = receiveAssignmentHandlers.get(handler)!;
      notificationsConnection!.off("ConversationAssigned", cb);
      receiveAssignmentHandlers.delete(handler);
    };
  }

  const cb = (dto: ConversationDto) => {
    try {
      console.log("[EVENT ConversationAssigned]", dto);

      handler(dto);

      const title = `Nueva asignación de ${dto?.clientName ?? ""}`;
      const body = `Le han asignado una nueva conversación del contacto: ${
        dto?.clientContactName ?? ""
      }`;
      const url = `https://staging.dsujq9sb48iiw.amplifyapp.com/chat/`;

      emitDesktopNotify({
        title,
        body,
        url,
        conversationId: dto?.conversationId,
      });
    } catch (err) {
      console.error("[onConversationAssigned] Error en callback:", err);
    }
  };

  console.log("[SIGNALR] registering ConversationAssigned handler");
  receiveAssignmentHandlers.set(handler, cb);
  notificationsConnection.on("ConversationAssigned", cb);

  return () => {
    const stored = receiveAssignmentHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup ConversationAssigned handler");
      notificationsConnection.off("ConversationAssigned", stored);
      receiveAssignmentHandlers.delete(handler);
    }
  };
}

export function offConversationAssigned(handler: (dto: ConversationDto) => void) {
  const stored = receiveAssignmentHandlers.get(handler);
  if (stored && notificationsConnection) {
    console.log("[SIGNALR] offConversationAssigned");
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
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onAssignmentResponse sin notificationsConnection");
    return () => {};
  }

  if (assignmentResponseHandlers.has(handler)) {
    console.log("[SIGNALR] onAssignmentResponse ya registrado");
    return () => {
      const cb = assignmentResponseHandlers.get(handler)!;
      notificationsConnection!.off("AssignmentResponse", cb);
      assignmentResponseHandlers.delete(handler);
    };
  }

  const cb = (payload: {
    conversationId: number;
    assignedAgentName: string;
    accepted: boolean;
    comment?: string;
    clientContactName: string;
    clientName: string;
  }) => {
    console.log("[EVENT AssignmentResponse]", payload);
    handler(payload);
  };

  console.log("[SIGNALR] registering AssignmentResponse handler");
  assignmentResponseHandlers.set(handler, cb);
  notificationsConnection.on("AssignmentResponse", cb);

  return () => {
    const stored = assignmentResponseHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup AssignmentResponse handler");
      notificationsConnection.off("AssignmentResponse", stored);
      assignmentResponseHandlers.delete(handler);
    }
  };
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
    console.log("[SIGNALR] offAssignmentResponse");
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
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onAssignmentForced sin notificationsConnection");
    return () => {};
  }

  if (assignmentForcedHandlers.has(handler)) {
    console.log("[SIGNALR] onAssignmentForced ya registrado");
    return () => {
      const cb = assignmentForcedHandlers.get(handler)!;
      notificationsConnection!.off("AssignmentForced", cb);
      assignmentForcedHandlers.delete(handler);
    };
  }

  const cb = (payload: {
    conversationId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => {
    console.log("[EVENT AssignmentForced]", payload);
    handler(payload);
  };

  console.log("[SIGNALR] registering AssignmentForced handler");
  assignmentForcedHandlers.set(handler, cb);
  notificationsConnection.on("AssignmentForced", cb);

  return () => {
    const stored = assignmentForcedHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup AssignmentForced handler");
      notificationsConnection.off("AssignmentForced", stored);
      assignmentForcedHandlers.delete(handler);
    }
  };
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
    console.log("[SIGNALR] offAssignmentForced");
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
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onAssignmentForcedAdmin sin notificationsConnection");
    return () => {};
  }

  if (assignmentForcedAdminHandlers.has(handler)) {
    console.log("[SIGNALR] onAssignmentForcedAdmin ya registrado");
    return () => {
      const cb = assignmentForcedAdminHandlers.get(handler)!;
      notificationsConnection!.off("AssignmentForcedAdmin", cb);
      assignmentForcedAdminHandlers.delete(handler);
    };
  }

  const cb = (payload: {
    conversationId: number;
    targetAgentId: number;
    comment: string;
    clientContactName: string;
    clientName: string;
  }) => {
    console.log("[EVENT AssignmentForcedAdmin]", payload);
    handler(payload);
  };

  console.log("[SIGNALR] registering AssignmentForcedAdmin handler");
  assignmentForcedAdminHandlers.set(handler, cb);
  notificationsConnection.on("AssignmentForcedAdmin", cb);

  return () => {
    const stored = assignmentForcedAdminHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup AssignmentForcedAdmin handler");
      notificationsConnection.off("AssignmentForcedAdmin", stored);
      assignmentForcedAdminHandlers.delete(handler);
    }
  };
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
    console.log("[SIGNALR] offAssignmentForcedAdmin");
    notificationsConnection.off("AssignmentForcedAdmin", stored);
    assignmentForcedAdminHandlers.delete(handler);
  }
}

export function onNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onNewContactValidation sin notificationsConnection");
    return () => {};
  }

  if (newContactValidationHandlers.has(handler)) {
    console.log("[SIGNALR] onNewContactValidation ya registrado");
    return () => {
      const cb = newContactValidationHandlers.get(handler)!;
      notificationsConnection!.off("newContactValidation", cb);
      newContactValidationHandlers.delete(handler);
    };
  }

  const cb = (payload: { contactLog: ContactLog }) => {
    console.log("[EVENT newContactValidation]", payload);
    handler(payload);
  };

  console.log("[SIGNALR] registering newContactValidation handler");
  newContactValidationHandlers.set(handler, cb);
  notificationsConnection.on("newContactValidation", cb);

  return () => {
    const stored = newContactValidationHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup newContactValidation handler");
      notificationsConnection.off("newContactValidation", stored);
      newContactValidationHandlers.delete(handler);
    }
  };
}

export function offNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  const stored = newContactValidationHandlers.get(handler);
  if (stored && notificationsConnection) {
    console.log("[SIGNALR] offNewContactValidation");
    notificationsConnection.off("newContactValidation", stored);
    newContactValidationHandlers.delete(handler);
  }
}

export function onPlayNewMessageSound(handler: (senderUserId: number) => void) {
  if (!notificationsConnection) {
    console.warn("[SIGNALR] onPlayNewMessageSound sin notificationsConnection");
    return () => {};
  }

  if (playSoundHandlers.has(handler)) {
    console.log("[SIGNALR] onPlayNewMessageSound ya registrado");
    return () => {
      const cb = playSoundHandlers.get(handler)!;
      notificationsConnection!.off("PlayNewMessageSound", cb);
      playSoundHandlers.delete(handler);
    };
  }

  const cb = (senderUserId: number) => {
    console.log("[EVENT PlayNewMessageSound]", { senderUserId });
    handler(Number(senderUserId));
  };

  console.log("[SIGNALR] registering PlayNewMessageSound handler");
  playSoundHandlers.set(handler, cb);
  notificationsConnection.on("PlayNewMessageSound", cb);

  return () => {
    const stored = playSoundHandlers.get(handler);
    if (stored && notificationsConnection) {
      console.log("[SIGNALR] cleanup PlayNewMessageSound handler");
      notificationsConnection.off("PlayNewMessageSound", stored);
      playSoundHandlers.delete(handler);
    }
  };
}

export function offPlayNewMessageSound(handler: (senderUserId: number) => void) {
  const stored = playSoundHandlers.get(handler);
  if (stored && notificationsConnection) {
    console.log("[SIGNALR] offPlayNewMessageSound");
    notificationsConnection.off("PlayNewMessageSound", stored);
    playSoundHandlers.delete(handler);
  }
}

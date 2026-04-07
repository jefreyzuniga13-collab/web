import type {
    ConversationDto,
    MessageDto,
    NotificationDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import { notificationSound } from "@/Utils/sound";
import { store } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { clearCart } from "@/Context/Slices/Ecommerce/cartSlice";
import { getNotificationsConnection } from "@/Services/signalr/connections";
import type {
    AssignmentForcedAdminPayload,
    AssignmentForcedPayload,
    AssignmentResponsePayload,
    CartClearedPayload,
  CartUpdatedPayload,
  NewContactValidationPayload,
  NewHumanRequestPayload,
  SupportRequestedPayload,
} from "@/Services/signalr/types";

const receiveAssignmentHandlers = new Map<
(dto: ConversationDto) => void,
(dto: ConversationDto) => void
>();

// Exponer eventos y handlers del notifications hub.
export function registerNotificationHandlers() {
  const connection = getNotificationsConnection();

  if (!connection) return;

  connection.off("SupportRequested");
  connection.on("SupportRequested", (payload: SupportRequestedPayload) => {
    window.dispatchEvent(new CustomEvent("SupportRequested", { detail: payload }));
  });

  connection.off("cart:updated");
  connection.on("cart:updated", (payload: CartUpdatedPayload) => {
    store.dispatch(
      setContactCartBadge({
        contactId: payload.contactId,
        hasCart: true,
        count:
          store.getState().cartBadge.byContactId?.[payload.contactId]?.count ?? 0,
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
  });

  connection.off("cart:cleared");
  connection.on("cart:cleared", (payload: CartClearedPayload) => {
    try {
      store.dispatch(
        setContactCartBadge({
          contactId: payload.contactId,
          hasCart: false,
          count: 0,
        })
      );

      const activeContactId = store.getState().cart.activeContactId;

      if (activeContactId === payload.contactId) {
        store.dispatch(clearCart());
      }
    } catch (error) {
      console.error("Error procesando cart:cleared", error);
    }
  });

  connection.off("ConversationAssigned");
  connection.on("ConversationAssigned", (dto: ConversationDto) => {
    window.dispatchEvent(new CustomEvent("ConversationAssigned", { detail: dto }));
  });

  connection.off("AssignmentResponse");
  connection.on("AssignmentResponse", (payload: AssignmentResponsePayload) => {
    window.dispatchEvent(new CustomEvent("AssignmentResponse", { detail: payload }));
  });

  connection.off("AssignmentForced");
  connection.on("AssignmentForced", (payload: AssignmentForcedPayload) => {
    window.dispatchEvent(new CustomEvent("AssignmentForced", { detail: payload }));
  });

  connection.off("AssignmentForcedAdmin");
  connection.on("AssignmentForcedAdmin", (payload: AssignmentForcedAdminPayload) => {
    window.dispatchEvent(
      new CustomEvent("AssignmentForcedAdmin", { detail: payload })
    );
  });

  connection.off("newContactValidation");
  connection.on("newContactValidation", (payload: NewContactValidationPayload) => {
    window.dispatchEvent(
      new CustomEvent("newContactValidation", { detail: payload })
    );
  });
}

export function onNewHumanRequest(
  handler: (payload: NewHumanRequestPayload) => void
) {
  getNotificationsConnection()?.on("NewHumanRequest", handler);
}

export function offNewHumanRequest(
  handler: (payload: NewHumanRequestPayload) => void
) {
  getNotificationsConnection()?.off("NewHumanRequest", handler);
}

export function onMessageStatusChanged(handler: (dto: MessageDto) => void) {
  getNotificationsConnection()?.on("MessageStatusChanged", handler);
}

export function offMessageStatusChanged(handler: (dto: MessageDto) => void) {
  getNotificationsConnection()?.off("MessageStatusChanged", handler);
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  getNotificationsConnection()?.on("Notification", handler);
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
  getNotificationsConnection()?.off("Notification", handler);
}

export function onSupportRequested(
  handler: (payload: SupportRequestedPayload) => void
) {
  getNotificationsConnection()?.on("SupportRequested", handler);
}

export function offSupportRequested(
  handler: (payload: SupportRequestedPayload) => void
) {
  getNotificationsConnection()?.off("SupportRequested", handler);
}

export function onConversationAssigned(handler: (dto: ConversationDto) => void) {
  const connection = getNotificationsConnection();

  if (!connection) {
    console.warn("notificationsConnection es null");
    return () => {};
  }

  if (receiveAssignmentHandlers.has(handler)) {
    return () => {
      const stored = receiveAssignmentHandlers.get(handler);
      if (!stored) return;

      connection.off("ConversationAssigned", stored);
      receiveAssignmentHandlers.delete(handler);
    };
  }

  const callback = (dto: ConversationDto) => {
    try {
      handler(dto);

      const title = `Nueva asignación de ${dto?.clientName ?? ""}`;
      const body = `Le han asignado una nueva conversación del contacto: ${dto?.clientContactName ?? ""}`;
      const url = "https://staging.dsujq9sb48iiw.amplifyapp.com/chat/";

      window.dispatchEvent(
        new CustomEvent("DesktopNotify", {
          detail: {
            title,
            body,
            url,
            conversationId: dto?.conversationId,
          },
        })
      );
    } catch (error) {
      console.error("Error en ConversationAssigned", error);
    }
  };

  receiveAssignmentHandlers.set(handler, callback);
  connection.off("ConversationAssigned", callback);
  connection.on("ConversationAssigned", callback);

  return () => {
    const stored = receiveAssignmentHandlers.get(handler);
    if (!stored) return;

    connection.off("ConversationAssigned", stored);
    receiveAssignmentHandlers.delete(handler);
  };
}

export function offConversationAssigned(handler: (dto: ConversationDto) => void) {
  const connection = getNotificationsConnection();
  const stored = receiveAssignmentHandlers.get(handler);

  if (connection && stored) {
    connection.off("ConversationAssigned", stored);
    receiveAssignmentHandlers.delete(handler);
  }
}

export function onAssignmentResponse(
  handler: (payload: AssignmentResponsePayload) => void
) {
  getNotificationsConnection()?.on("AssignmentResponse", handler);
}

export function offAssignmentResponse(
  handler: (payload: AssignmentResponsePayload) => void
) {
  getNotificationsConnection()?.off("AssignmentResponse", handler);
}

export function onAssignmentForced(
  handler: (payload: AssignmentForcedPayload) => void
) {
  getNotificationsConnection()?.on("AssignmentForced", handler);
}

export function offAssignmentForced(
  handler: (payload: AssignmentForcedPayload) => void
) {
  getNotificationsConnection()?.off("AssignmentForced", handler);
}

export function onAssignmentForcedAdmin(
  handler: (payload: AssignmentForcedAdminPayload) => void
) {
  getNotificationsConnection()?.on("AssignmentForcedAdmin", handler);
}

export function offAssignmentForcedAdmin(
  handler: (payload: AssignmentForcedAdminPayload) => void
) {
  getNotificationsConnection()?.off("AssignmentForcedAdmin", handler);
}

export function onNewContactValidation(
  handler: (payload: NewContactValidationPayload) => void
) {
  getNotificationsConnection()?.on("newContactValidation", handler);
  notificationSound.play();
}

export function offNewContactValidation(
  handler: (payload: NewContactValidationPayload) => void
) {
  getNotificationsConnection()?.off("newContactValidation", handler);
}

export function onPlayNewMessageSound(
  handler: (senderUserId: number) => void
) {
  getNotificationsConnection()?.on("PlayNewMessageSound", (senderUserId: unknown) => {
    handler(Number(senderUserId));
  });
}

export function offPlayNewMessageSound() {
  getNotificationsConnection()?.off("PlayNewMessageSound");
}
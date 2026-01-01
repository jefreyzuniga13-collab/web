/* eslint-disable @typescript-eslint/no-explicit-any */
import * as signalR from '@microsoft/signalr'
import type {
  MessageDto,
  AttachmentDto,
  ConversationDto,
  NotificationDto,
} from '@/Interfaces/Chat/ChatInterfaces'
import type { ContactLog } from '@/Interfaces/Auth/UserInterfaces'
import { notificationSound } from '@/Utils/sound'
import {formatDateTimeNI } from "@/Utils/niDate";
import { store } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { clearCart } from "@/Context/Slices/Ecommerce/cartSlice";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ??
  'VITE_API_URL=https://crmpcg.com/api/v1'
const HUB_BASE = API_URL.replace(/\/api\/v1$/, '')

let chatConnection: signalR.HubConnection | null = null
export let notificationsConnection: signalR.HubConnection | null = null
export let presenceConnection: signalR.HubConnection | null = null
export let userConeccion: signalR.HubConnection | null = null

export async function createHubConnection(token: string) {
  chatConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/chat`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  chatConnection.onreconnecting(err => console.warn('Reconnecting to Chat Hub...', err))
  chatConnection.onreconnected(() => console.info('Reconnected to Chat Hub'))
  chatConnection.onclose(err => {
     console.info("Coneccion cerrada", err)
    // toast.warn('La conexión al chat ha finalizado. Por favor inicia sesión nuevamente.')
  })

  userConeccion = new signalR.HubConnectionBuilder()
  .withUrl(`${HUB_BASE}/hubs/users`, {accessTokenFactory: ()=> token})
  .withAutomaticReconnect()
  .build();

  userConeccion.onreconnecting(err=> console.warn("Reconnecting to User Hub...", err))
  userConeccion.onreconnected(()=> console.info("Reconnected to User Chat Hub"));
  userConeccion.onclose(err =>{
    console.info("Coneccion cerrada", err)
  })

  notificationsConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/notifications`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  notificationsConnection.onreconnecting(err =>
    console.warn('Reconnecting to Notifications Hub...', err)
  )
  
  notificationsConnection.onreconnected(() =>
    console.info('Reconnected to Notifications Hub')
  )

  notificationsConnection.onclose(err =>
     console.info("Coneccion cerrada", err)
  )

  presenceConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/presence`, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presenceConnection.on('UserIsOnline', (userId: number) => {
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presenceConnection.on('UserIsOffline', (userId: number) => {
  })

  presenceConnection.onreconnecting(err =>
    console.warn('Reconnecting to Presence Hub...', err)
  )
  presenceConnection.onreconnected(() =>
    console.info('Reconnected to Presence Hub')
  )
  presenceConnection.onclose(err =>
    console.warn('Presence Hub connection closed', err)
  )

  // notifications handlers
  notificationsConnection.on(
    'SupportRequested',
    (payload: { conversationId: number; requestedAt: string; clientContactName: string; clientName: string; }) => {
      window.dispatchEvent(new CustomEvent('SupportRequested', { detail: payload }))
    }
  )

  // CART (GLOBAL)
notificationsConnection.on(
  "cart:updated",
  async (payload: { contactId: number; orderId: number }) => {

    // Marca rápido (optimista)
    store.dispatch(setContactCartBadge({
      contactId: payload.contactId,
      hasCart: true,
      count: store.getState().cartBadge.byContactId?.[payload.contactId]?.count ?? 0
    }));

    const state = store.getState();
    const activeContactId = state.cart.activeContactId;

    // emitur evento
    if (activeContactId === payload.contactId) {
      window.dispatchEvent(
        new CustomEvent("CartReloadForActiveContact", {
          detail: payload
        })
      );
    }
  }
);

notificationsConnection.on(
  "cart:cleared",
  (payload: { contactId: number; orderId: number; conversationId: number }) => {
    try {
      //  Actualizar el badge de ESE contacto
      store.dispatch(
        setContactCartBadge({
          contactId: payload.contactId,
          hasCart: false,
          count: 0
        })
      );

      // 2) Si el carrito visible corresponde a ese contacto, límpialo
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

  notificationsConnection.on(
    'ConversationAssigned',
    (dto: ConversationDto) => {
      window.dispatchEvent(new CustomEvent('ConversationAssigned', { detail: dto }))
    }
  )

  notificationsConnection.on(
    'AssignmentResponse',
    (payload: { conversationId: number; assignedAgentName: string, accepted: boolean; comment?: string,  clientContactName: string; clientName: string; }) => {
      window.dispatchEvent(new CustomEvent('AssignmentResponse', { detail: payload }))
    }
  )

  notificationsConnection.on(
    'AssignmentForced',
    (payload: { conversationId: number; comment: string, clientContactName: string; clientName: string; }) => {
      window.dispatchEvent(new CustomEvent('AssignmentForced', { detail: payload }))
    }
  )

  notificationsConnection.on(
    'AssignmentForcedAdmin',
    (payload: { conversationId: number; targetAgentId: number; comment: string, clientContactName: string; clientName: string;  }) => {
      window.dispatchEvent(new CustomEvent('AssignmentForcedAdmin', { detail: payload }))
    }
  )

    notificationsConnection.on(
    'offNewContactValidation',
    (payload: {contactLog: ContactLog}) => {
      window.dispatchEvent(new CustomEvent('newContactValidation', { detail: payload }))
    }
  )

  try {
    await Promise.all([
      chatConnection.start(),
      notificationsConnection.start(),
      presenceConnection.start(),
      userConeccion.start()
    ])
    return { chatConnection, notificationsConnection, presenceConnection, userConeccion }
  } catch (error) {
     console.info("Coneccion cerrada", error)
    throw error
  }
}

// --- chat methods ---
export function joinConversation(conversationId: number) {
  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    chatConnection.invoke('JoinConversation', conversationId.toString())
  }
}

export function leaveConversation(conversationId: number) {
  if (chatConnection?.state === signalR.HubConnectionState.Connected) {
    chatConnection.invoke('LeaveConversation', conversationId.toString())
  }
}
  
const receiveHandlers = new Map<
  (p: { message: MessageDto; attachments: AttachmentDto[] }) => void,
  (message: MessageDto, attachments?: AttachmentDto[]) => void
>();

//Enviar notificación cuando se recibe mensaje, fuera  de la venta del sitio
export function onNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) 
{

  if (!chatConnection) return () => {};

  // si ya estaba registrado, no lo dupliques
  if (receiveHandlers.has(handler)) {
    return () => {
      const cb = receiveHandlers.get(handler)!;
      chatConnection!.off('ReceiveMessage', cb);
      receiveHandlers.delete(handler);
    };
  }

  const cb = (message: MessageDto, attachments?: AttachmentDto[]) => 
    {
    try {
      handler({ message, attachments: attachments ?? [] });

      // --- NOTIFICACIÓN DESKTOP (tu lógica actual) ---
      // const sentAtDate = new Date(message?.sentAt as any);
      // const sentAtOk = !isNaN(sentAtDate.getTime());
      const sentAtText = message?.sentAt ? formatDateTimeNI(message.sentAt) : "";


      const title = `${message?.senderClientName ?? ''} ${
        message?.senderContactName ?? message?.senderUserName ?? ''
      } recibido: ${sentAtText}`;
      const body = (message?.content && message.content.trim()) || '(Mensaje con adjunto)';
      const url = `https://staging.dsujq9sb48iiw.amplifyapp.com/chat/`;

      window.dispatchEvent(
        new CustomEvent('DesktopNotify', {
          detail: { title, body, url, conversationId: message?.conversationId },
        })
      );
    } catch (err) {
      console.error('Error en onNewMessage:', err);
    }
  };

  receiveHandlers.set(handler, cb);
  chatConnection.on('ReceiveMessage', cb);

  // devolver función para desuscribirse
  return () => {
    const stored = receiveHandlers.get(handler);
    if (stored) {
      chatConnection!.off('ReceiveMessage', stored);
      receiveHandlers.delete(handler);
    }
  };
}

export function offNewMessage(
  handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
) {
  const stored = receiveHandlers.get(handler);
  if (stored && chatConnection) {
    chatConnection.off('ReceiveMessage', stored);
    receiveHandlers.delete(handler);
  }
}

export function offNewContact(){
  userConeccion?.off("newContactValidation");
}

export function onConversationCreated(handler: (convo: ConversationDto) => void) {
  chatConnection?.on('ConversationCreated', handler)
}
export function offConversationCreated(handler: (convo: ConversationDto) => void) {
  chatConnection?.off('ConversationCreated', handler)
}

export function onConversationUpdated(handler: (c: ConversationDto) => void) {
  chatConnection?.on('ConversationUpdated', handler)
}

export function offConversationUpdated(handler: (c: ConversationDto) => void) {
  chatConnection?.off('ConversationUpdated', handler)
}

export function onNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.on('NewHumanRequest', handler)
}

export function offNewHumanRequest(
  handler: (payload: { conversationId: number; fromPhone: string }) => void
) {
  notificationsConnection?.off('NewHumanRequest', handler)
}

export function onMessageStatusChanged(handler: (msg: MessageDto) => void) {
  notificationsConnection?.on('MessageStatusChanged', handler)
}

export function offMessageStatusChanged(handler: (msg: MessageDto) => void) {
  notificationsConnection?.off('MessageStatusChanged', handler)
}

export function onNewNotification(handler: (dto: NotificationDto) => void) {
  notificationsConnection?.on('Notification', handler)
}

export function offNewNotification(handler: (dto: NotificationDto) => void) {
  notificationsConnection?.off('Notification', handler)
}

// --- notifications methods ---
export function onSupportRequested(
  handler: (payload: { conversationId: number;  requestedAt: string; clientContactName: string; clientName: string; }) => void
) {
  notificationsConnection?.on('SupportRequested', handler)
  
}

export function offSupportRequested(
  handler: (payload: { conversationId: number; requestedAt: string; clientContactName: string; clientName: string;  }) => void
) {
  notificationsConnection?.off('SupportRequested', handler)
}

// --------

//Agregar las notificación, cuando se envia una solicitud de asignación
// Mapa: tu handler original -> callback realmente suscrito al hub
const receiveAssignmentHandlers = new Map<
  (dto: ConversationDto) => void,
  (dto: ConversationDto) => void
>();

export function onConversationAssigned(
  handler: (dto: ConversationDto) => void
) {
  // 0) Verifica conexión
  if (!notificationsConnection) {
    console.warn('[onConversationAssigned] notificationsConnection es null. ¿Llamaste createHubConnection()?');
    // devolvemos un no-op para evitar crashear
    return () => {};
  }

  // 1) Evita duplicados
  if (receiveAssignmentHandlers.has(handler)) {
    return () => {
      const cb = receiveAssignmentHandlers.get(handler)!;
      notificationsConnection!.off('ConversationAssigned', cb);
      receiveAssignmentHandlers.delete(handler);

    };
  }

  // 2) Callback real
  const cb = (dto: ConversationDto) => {
    try {
      handler(dto);

      // --- NOTIFICACIÓN DESKTOP ---
      const title = `Nueva asignación de ${dto?.clientName ?? ''}`;
      const body = `Le han asignado una nueva conversación del contacto: ${dto?.clientContactName ?? ''}`;
      const url = `https://staging.dsujq9sb48iiw.amplifyapp.com/chat/`;

      window.dispatchEvent(
        new CustomEvent('DesktopNotify', {
          detail: { title, body, url, conversationId: dto?.conversationId },
        })
      );

    } catch (err) {
      console.error('[onConversationAssigned] Error en callback:', err);
    }
  };

  receiveAssignmentHandlers.set(handler, cb);

  // 3) Suscripción resiliente a estados
  const subscribe = () => {
    notificationsConnection!.off('ConversationAssigned', cb); // por si acaso
    notificationsConnection!.on('ConversationAssigned', cb);
  };

  // Puedes registrar .on antes de start(), pero aquí lo hacemos explícito y loggeado
  if (notificationsConnection.state === signalR.HubConnectionState.Connected) {
    subscribe();
  } else {
    console.warn('[onConversationAssigned] Conexión no conectada aún. Estado:', notificationsConnection.state);
    // Nos suscribimos igual y además re-suscribimos en reconexiones
    subscribe();

    notificationsConnection.onreconnected(() => {
      subscribe();
    });
  }

  // devolver unsubscribe
  return () => {
    const stored = receiveAssignmentHandlers.get(handler);
    if (stored) {
      notificationsConnection!.off('ConversationAssigned', stored);
      receiveAssignmentHandlers.delete(handler);
    }
  };
}

export function offConversationAssigned(
  handler: (dto: ConversationDto) => void
) {
  const stored = receiveAssignmentHandlers.get(handler);
  if (stored && notificationsConnection) {
    notificationsConnection.off('ConversationAssigned', stored);
    receiveAssignmentHandlers.delete(handler);
  }
}

// --------

export function onAssignmentResponse(
  handler: (payload: { conversationId: number; assignedAgentName: string, accepted: boolean; comment?: string; clientContactName: string; clientName: string;  }) => void
) {
  notificationsConnection?.on('AssignmentResponse', handler)
}
export function offAssignmentResponse(
  handler: (payload: { conversationId: number; assignedAgentName: string, accepted: boolean; comment?: string; clientContactName: string; clientName: string;  }) => void
) {
  notificationsConnection?.off('AssignmentResponse', handler)
}

export function onAssignmentForced(
  handler: (payload: { conversationId: number; comment: string; clientContactName: string; clientName: string }) => void
) {
  notificationsConnection?.on('AssignmentForced', handler)
}
export function offAssignmentForced(
  handler: (payload: { conversationId: number; comment: string; clientContactName: string; clientName: string;  }) => void
) {
  notificationsConnection?.off('AssignmentForced', handler)
}

export function onAssignmentForcedAdmin(
  handler: (payload: { conversationId: number; targetAgentId: number; comment: string; clientContactName: string; clientName: string }) => void
) {
  notificationsConnection?.on('AssignmentForcedAdmin', handler)
}

export function offAssignmentForcedAdmin(
  handler: (payload: { conversationId: number; targetAgentId: number; comment: string ; clientContactName: string; clientName: string }) => void
) {
  notificationsConnection?.off('AssignmentForcedAdmin', handler)
}

export function onNewContactValidation(
  handler: (payload: { contactLog: ContactLog }) => void
) {
  notificationsConnection?.on('newContactValidation', handler)
  notificationSound.play();
  
}

export function offNewContactValidation(
  handler: (payload: { contactLog: ContactLog}) => void
) {
  notificationsConnection?.off('newContactValidation', handler)
}

export function onPlayNewMessageSound(
  handler: (senderUserId: number) => void
) {
  notificationsConnection?.on(
    'PlayNewMessageSound',
    (senderUserId: any) => {
      handler(Number(senderUserId));
    }
  );
}

export function offPlayNewMessageSound() {
  notificationsConnection?.off('PlayNewMessageSound');
}
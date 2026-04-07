export { SIGNALR_CONFIG } from "@/Services/signalr/config";

export {
    createHubConnection,
    stopHubConnection,
    getConnections,
    getChatConnection,
    getNotificationsConnection,
    getPresenceConnection,
    getUserConnection,
} from "@/Services/signalr/connections";

export {
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    onConversationCreated,
  offConversationCreated,
  onConversationUpdated,
  offConversationUpdated,
} from "@/Services/signalr/chat";

export {
    registerNotificationHandlers,
    onNewHumanRequest,
    offNewHumanRequest,
    onMessageStatusChanged,
    offMessageStatusChanged,
    onNewNotification,
    offNewNotification,
    onSupportRequested,
    offSupportRequested,
    onConversationAssigned,
    offConversationAssigned,
    onAssignmentResponse,
    offAssignmentResponse,
    onAssignmentForced,
    offAssignmentForced,
    onAssignmentForcedAdmin,
    offAssignmentForcedAdmin,
    onNewContactValidation,
    offNewContactValidation,
    onPlayNewMessageSound,
  offPlayNewMessageSound,
} from "@/Services/signalr/notifications";


// Reexportar API pública del módulo SignalR.
export { registerPresenceHandlers } from "@/Services/signalr/presence";
export { offNewContact } from "@/Services/signalr/users";
export type * from "@/Services/signalr/types";
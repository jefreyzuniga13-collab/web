import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import {
  createHubConnection,
  joinConversation,
  leaveConversation,
  onNewMessage,
  offNewMessage,
  onNewHumanRequest,
  offNewHumanRequest,
  onConversationCreated,
  offConversationCreated,
  onConversationUpdated,
  offConversationUpdated,
  onMessageStatusChanged,
  offMessageStatusChanged,
  onNewNotification,
  offNewNotification
} from '@/Services/signalr';
import type {
  MessageDto,
  AttachmentDto,
  ConversationDto,
  NotificationDto
} from '@/Interfaces/Chat/ChatInterfaces';

interface SignalRContextValue {
  joinConversation: (id: number) => void;
  leaveConversation: (id: number) => void;

  onNewMessage: (
    handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
  ) => void;
  offNewMessage: (
    handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
  ) => void;

  onNewHumanRequest: (
    handler: (payload: { conversationId: number; fromPhone: string }) => void
  ) => void;
  offNewHumanRequest: (
    handler: (payload: { conversationId: number; fromPhone: string }) => void
  ) => void;

  onConversationCreated: (handler: (convo: ConversationDto) => void) => void;
  offConversationCreated: (handler: (convo: ConversationDto) => void) => void;

  onConversationUpdated: (handler: (convo: ConversationDto) => void) => void;
  offConversationUpdated: (handler: (convo: ConversationDto) => void) => void;

  onMessageStatusChanged: (handler: (msg: MessageDto) => void) => void;
  offMessageStatusChanged: (handler: (msg: MessageDto) => void) => void;

  onNewNotification: (handler: (notification: NotificationDto) => void) => void;
  offNewNotification: (handler: (notification: NotificationDto) => void) => void;
  
}

const SignalRContext = createContext<SignalRContextValue>({
  joinConversation: () => {},
  leaveConversation: () => {},

  onNewMessage: () => {},
  offNewMessage: () => {},

  onNewHumanRequest: () => {},
  offNewHumanRequest: () => {},

  onConversationCreated: () => {},
  offConversationCreated: () => {},

  onConversationUpdated: () => {},
  offConversationUpdated: () => {},

  onMessageStatusChanged: () => {},
  offMessageStatusChanged: () => {},

  onNewNotification: () => {},
  offNewNotification: () => {},

});

export const SignalRProvider: React.FC<{ token: string; children: ReactNode }> = ({
  token,
  children
}) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    createHubConnection(token)
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [token]);

  if (!ready) return <></>;

  return (
    <SignalRContext.Provider
      value={{
        joinConversation,
        leaveConversation,
        onNewMessage,
        offNewMessage,
        onNewHumanRequest,
        offNewHumanRequest,
        onConversationCreated,
        offConversationCreated,
        onConversationUpdated,
        offConversationUpdated,
        onMessageStatusChanged,
        offMessageStatusChanged,
        onNewNotification,
        offNewNotification
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useSignalR() {
  return useContext(SignalRContext);
}
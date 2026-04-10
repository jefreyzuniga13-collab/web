import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  offNewNotification,
} from "@/Services/signalr";

import type {
  MessageDto,
  AttachmentDto,
  ConversationDto,
  NotificationDto
} from "@/Interfaces/Chat/ChatInterfaces";

interface SignalRContextValue {
  ready: boolean;
  joinConversation(id: number): void;
  leaveConversation(id: number): void;
  onNewMessage(handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void): void;
  offNewMessage(handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void): void;
  onNewHumanRequest(handler: (payload: { conversationId: number; fromPhone: string }) => void): void;
  offNewHumanRequest(handler: (payload: { conversationId: number; fromPhone: string }) => void): void;
  onConversationCreated(handler: (convo: ConversationDto) => void): void;
  offConversationCreated(handler: (convo: ConversationDto) => void): void;
  onConversationUpdated(handler: (convo: ConversationDto) => void): void;
  offConversationUpdated(handler: (convo: ConversationDto) => void): void;
  onMessageStatusChanged(handler: (msg: MessageDto) => void): void;
  offMessageStatusChanged(handler: (msg: MessageDto) => void): void;
  onNewNotification(handler: (notification: NotificationDto) => void): void;
  offNewNotification(handler: (notification: NotificationDto) => void): void;
}

const SignalRContext = createContext<SignalRContextValue>({
  ready: false,
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

export const SignalRProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    createHubConnection()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;

  return (
    <SignalRContext.Provider
      value={{
        ready,
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
        offNewNotification,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export function useSignalR(): SignalRContextValue {
  return useContext(SignalRContext);
}
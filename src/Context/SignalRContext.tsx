import React, { createContext, useContext, useEffect, useState, type ReactNode,} from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/Context";
import {createHubConnection,joinConversation,leaveConversation,onNewMessage,offNewMessage,onNewHumanRequest,offNewHumanRequest,onConversationCreated,offConversationCreated,
  onConversationUpdated,offConversationUpdated,onMessageStatusChanged,offMessageStatusChanged,onNewNotification,offNewNotification,onLoginApprovalRequested,
  offLoginApprovalRequested,onForceLogout,offForceLogout,stopHubConnection,} from "@/Services/signalr";
import type {MessageDto,AttachmentDto,ConversationDto,NotificationDto,} from "@/Interfaces/Chat/ChatInterfaces";

import type {
  ForceLogoutDto,
  LoginApprovalRequestedDto,
} from "@/Interfaces/Auth/AuthInterface";

interface SignalRContextValue {
  ready: boolean;

  joinConversation(id: number): void;
  leaveConversation(id: number): void;

  onNewMessage(
    handler: (payload: {
      message: MessageDto;
      attachments: AttachmentDto[];
    }) => void,
  ): void;

  offNewMessage(
    handler: (payload: {
      message: MessageDto;
      attachments: AttachmentDto[];
    }) => void,
  ): void;

  onNewHumanRequest(
    handler: (payload: { conversationId: number; fromPhone: string }) => void,
  ): void;

  offNewHumanRequest(
    handler: (payload: { conversationId: number; fromPhone: string }) => void,
  ): void;

  onConversationCreated(handler: (conversation: ConversationDto) => void): void;

  offConversationCreated(
    handler: (conversation: ConversationDto) => void,
  ): void;

  onConversationUpdated(handler: (conversation: ConversationDto) => void): void;

  offConversationUpdated(
    handler: (conversation: ConversationDto) => void,
  ): void;

  onMessageStatusChanged(handler: (message: MessageDto) => void): void;

  offMessageStatusChanged(handler: (message: MessageDto) => void): void;

  onNewNotification(handler: (notification: NotificationDto) => void): void;

  offNewNotification(handler: (notification: NotificationDto) => void): void;

  onLoginApprovalRequested(
    handler: (payload: LoginApprovalRequestedDto) => void,
  ): void;

  offLoginApprovalRequested(
    handler: (payload: LoginApprovalRequestedDto) => void,
  ): void;

  onForceLogout(handler: (payload: ForceLogoutDto) => void): void;

  offForceLogout(handler: (payload: ForceLogoutDto) => void): void;
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

  onLoginApprovalRequested: () => {},
  offLoginApprovalRequested: () => {},

  onForceLogout: () => {},
  offForceLogout: () => {},
});

/**
 * Proveedor global de SignalR para usuarios autenticados.
 */
export const SignalRProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [ready, setReady] = useState(false);

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const isRoot = useSelector((state: RootState) => state.auth.isRoot);

  const activeCompanyId = useSelector(
    (state: RootState) => state.company.activeCompanyId,
  );

  useEffect(() => {
    let mounted = true;

    const startSignalR = async () => {
      try {
        setReady(false);

        if (!isAuthenticated) {
          await stopHubConnection();

          if (mounted) {
            setReady(true);
          }

          return;
        }

        if (isRoot && (!activeCompanyId || Number(activeCompanyId) <= 0)) {
          await stopHubConnection();

          if (mounted) {
            setReady(true);
          }

          return;
        }

        await createHubConnection();

        if (mounted) {
          setReady(true);
        }
      } catch (error) {
        console.error("[SignalRProvider] Error al iniciar SignalR.", error);

        if (mounted) {
          /*
           * No se bloquea toda la aplicación por una caída
           * temporal de SignalR.
           */
          setReady(true);
        }
      }
    };

    void startSignalR();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isRoot, activeCompanyId]);

  if (!ready) {
    return null;
  }

  return (
    <SignalRContext.Provider
      value={{
        ready,

        // Chat
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

        // Auth
        onLoginApprovalRequested,
        offLoginApprovalRequested,

        onForceLogout,
        offForceLogout,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export function useSignalR(): SignalRContextValue {
  return useContext(SignalRContext);
}
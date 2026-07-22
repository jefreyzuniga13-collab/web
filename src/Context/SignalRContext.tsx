import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSelector } from "react-redux";

import type { RootState } from "@/Context";

import {
  createHubConnection,
  joinConversation,
  leaveConversation,
  offConversationCreated,
  offConversationUpdated,
  offForceLogout,
  offMessageStatusChanged,
  offNewHumanRequest,
  offNewMessage,
  offNewNotification,
  onConversationCreated,
  onConversationUpdated,
  onForceLogout,
  onMessageStatusChanged,
  onNewHumanRequest,
  onNewMessage,
  onNewNotification,
  stopHubConnection,
} from "@/Services/signalr";

interface SignalRContextValue {
  ready: boolean;

  joinConversation: typeof joinConversation;
  leaveConversation: typeof leaveConversation;

  onNewMessage: typeof onNewMessage;
  offNewMessage: typeof offNewMessage;

  onNewHumanRequest: typeof onNewHumanRequest;
  offNewHumanRequest: typeof offNewHumanRequest;

  onConversationCreated: typeof onConversationCreated;
  offConversationCreated: typeof offConversationCreated;

  onConversationUpdated: typeof onConversationUpdated;
  offConversationUpdated: typeof offConversationUpdated;

  onMessageStatusChanged: typeof onMessageStatusChanged;
  offMessageStatusChanged: typeof offMessageStatusChanged;

  onNewNotification: typeof onNewNotification;
  offNewNotification: typeof offNewNotification;

  onForceLogout: typeof onForceLogout;
  offForceLogout: typeof offForceLogout;
}

const SignalRContext =
  createContext<SignalRContextValue | null>(null);

/**
 * Proveedor global de SignalR.
 *
 * Reinicia las conexiones cuando cambia la autenticación
 * o la empresa activa del usuario Root.
 */
export const SignalRProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [ready, setReady] = useState(false);

  const isAuthenticated = useSelector(
    (state: RootState) =>
      state.auth.isAuthenticated,
  );

  const isRoot = useSelector(
    (state: RootState) =>
      state.auth.isRoot,
  );

  const activeCompanyId = useSelector(
    (state: RootState) =>
      state.company.activeCompanyId,
  );

  useEffect(() => {
    let mounted = true;

    const synchronizeSignalR = async () => {
      setReady(false);

      try {
        /*
         * Detiene conexiones anteriores para evitar conservar
         * grupos SignalR de otra empresa.
         */
        await stopHubConnection();

        if (!mounted) return;

        // Sin autenticación no se crean conexiones.
        if (!isAuthenticated) return;

        /*
         * El usuario Root debe seleccionar una empresa
         * antes de conectarse a los hubs del tenant.
         */
        if (
          isRoot &&
          (!activeCompanyId ||
            Number(activeCompanyId) <= 0)
        ) {
          return;
        }

        await createHubConnection();
      } catch (error) {
        console.error(
          "[SignalRProvider] Error al iniciar SignalR.",
          error,
        );
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    void synchronizeSignalR();

    return () => {
      mounted = false;
      void stopHubConnection();
    };
  }, [
    activeCompanyId,
    isAuthenticated,
    isRoot,
  ]);

  const contextValue =
    useMemo<SignalRContextValue>(
      () => ({
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

        // Sesión única
        onForceLogout,
        offForceLogout,
      }),
      [ready],
    );

  if (!ready) {
    return null;
  }

  return (
    <SignalRContext.Provider value={contextValue}>
      {children}
    </SignalRContext.Provider>
  );
};

export function useSignalR(): SignalRContextValue {
  const context = useContext(SignalRContext);

  if (!context) {
    throw new Error(
      "useSignalR debe utilizarse dentro de SignalRProvider.",
    );
  }

  return context;
}
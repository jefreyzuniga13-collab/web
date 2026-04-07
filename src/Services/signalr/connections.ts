import * as signalR from "@microsoft/signalr";
import { SIGNALR_CONFIG } from "@/Services/signalr/config";
import type { SignalRConnections } from "@/Services/signalr/types";

let chatConnection: signalR.HubConnection | null = null;
let notificationsConnection: signalR.HubConnection | null = null;
let presenceConnection: signalR.HubConnection | null = null;
let userConnection: signalR.HubConnection | null = null;

// Centralizar creación y ciclo de vida de conexiones.
let isStartingConnections = false;
let startPromise: Promise<void> | null = null;

function buildConnection(url: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
    })
    .withAutomaticReconnect(SIGNALR_CONFIG.reconnectDelaysInMilliseconds)
    .build();
}

function registerLifecycle(
  connection: signalR.HubConnection,
  hubName: string
) {
  connection.onreconnecting((error) => {
    console.warn(`Reconectando ${hubName}`, error);
  });

  connection.onreconnected(() => {
    console.info(`${hubName} reconectado`);
  });

  connection.onclose((error) => {
    console.info(`Conexión cerrada ${hubName}`, error);
  });
}

function ensureConnections() {
  if (!chatConnection) {
    chatConnection = buildConnection(SIGNALR_CONFIG.hubs.chat);
    registerLifecycle(chatConnection, "Chat Hub");
  }

  if (!notificationsConnection) {
    notificationsConnection = buildConnection(SIGNALR_CONFIG.hubs.notifications);
    registerLifecycle(notificationsConnection, "Notifications Hub");
  }

  if (!presenceConnection) {
    presenceConnection = buildConnection(SIGNALR_CONFIG.hubs.presence);
    registerLifecycle(presenceConnection, "Presence Hub");
  }

  if (!userConnection) {
    userConnection = buildConnection(SIGNALR_CONFIG.hubs.users);
    registerLifecycle(userConnection, "Users Hub");
  }
}

async function startIfNeeded(connection: signalR.HubConnection | null) {
  if (!connection) return;

  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start();
  }
}

export function getConnections(): SignalRConnections {
  return {
    chatConnection,
    notificationsConnection,
    presenceConnection,
    userConnection,
  };
}

export async function createHubConnection() {
  if (isStartingConnections && startPromise) {
    await startPromise;
    return getConnections();
  }

  ensureConnections();

  isStartingConnections = true;
  startPromise = (async () => {
    await Promise.all([
      startIfNeeded(chatConnection),
      startIfNeeded(notificationsConnection),
      startIfNeeded(presenceConnection),
      startIfNeeded(userConnection),
    ]);
  })();

  try {
    await startPromise;
    return getConnections();
  } catch (error) {
    console.error("Error iniciando SignalR", error);
    throw error;
  } finally {
    isStartingConnections = false;
    startPromise = null;
  }
}

export async function stopHubConnection() {
  const connections = [
    chatConnection,
    notificationsConnection,
    presenceConnection,
    userConnection,
  ];

  await Promise.all(
    connections.map(async (connection) => {
      if (
        connection &&
        connection.state !== signalR.HubConnectionState.Disconnected
      ) {
        try {
          await connection.stop();
        } catch (error) {
          console.warn("Error cerrando conexión SignalR", error);
        }
      }
    })
  );
}

export function getChatConnection() {
  return chatConnection;
}

export function getNotificationsConnection() {
  return notificationsConnection;
}

export function getPresenceConnection() {
  return presenceConnection;
}

export function getUserConnection() {
  return userConnection;
}
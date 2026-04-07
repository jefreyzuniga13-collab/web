import { useEffect, useState } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { userService } from "@/Services/auth/UserService";
import {
  createHubConnection,
  getPresenceConnection,
} from "@/Services/signalr";

export function useUserPresence(userId: number) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    if (!userId) return;

    userService
      .getUserPresence(userId)
      .then((dto) => {
        setIsOnline(dto.data.isOnline);
        setLastOnline(dto.data.lastOnline ? new Date(dto.data.lastOnline) : null);
      })
      .catch((error) => {
        console.error("Error obteniendo presencia inicial", error);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const registerPresence = async () => {
      try {
        await createHubConnection();

        const connection = getPresenceConnection();
        if (!connection) return;

        const onOnline = (id: number) => {
          if (!isMounted) return;
          if (id === userId) {
            setIsOnline(true);
          }
        };

        const onOffline = (id: number, lastSeen?: string | Date) => {
          if (!isMounted) return;
          if (id === userId) {
            setIsOnline(false);
            setLastOnline(lastSeen ? new Date(lastSeen) : new Date());
          }
        };

        connection.off("UserIsOnline", onOnline);
        connection.on("UserIsOnline", onOnline);

        connection.off("UserIsOffline", onOffline);
        connection.on("UserIsOffline", onOffline);

        return () => {
          connection.off("UserIsOnline", onOnline);
          connection.off("UserIsOffline", onOffline);
        };
      } catch (error) {
        console.error("Error registrando eventos de presencia", error);
      }
    };

    let cleanup: (() => void) | undefined;

    registerPresence().then((fn) => {
      cleanup = fn;
    });

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [userId]);

  return { isOnline, lastOnline };
}

export async function markOffline(userId: number) {
  if (!userId) return;

  await createHubConnection();

  const connection = getPresenceConnection();
  if (!connection) return;

  if (connection.state !== HubConnectionState.Connected) {
    return;
  }

  await connection.invoke("UserDisconnected", userId);
}
import { getPresenceConnection } from "@/Services/signalr/connections";

// Registrar eventos básicos del presence hub.
export function registerPresenceHandlers() {
  const connection = getPresenceConnection();

  if (!connection) return;

  connection.off("UserIsOnline");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connection.on("UserIsOnline", (_userId: number) => {});

  connection.off("UserIsOffline");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connection.on("UserIsOffline", (_userId: number) => {});
}
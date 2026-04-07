const API_URL =
import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ??
"https://crmpcg.com/api/v1";

const HUB_BASE = API_URL.replace(/\/api\/v1$/, "");

// Definir configuración base de SignalR.
export const SIGNALR_CONFIG = {
  apiUrl: API_URL,
  hubBase: HUB_BASE,
  reconnectDelaysInMilliseconds: [0, 2000, 5000, 10000, 20000] as number[],
  hubs: {
    chat: `${HUB_BASE}/hubs/chat`,
    notifications: `${HUB_BASE}/hubs/notifications`,
    presence: `${HUB_BASE}/hubs/presence`,
    users: `${HUB_BASE}/hubs/users`,
  },
};
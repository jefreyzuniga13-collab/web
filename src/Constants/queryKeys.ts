// Centralizar claves de React Query.
export const QUERY_KEYS = {
  agents: ["agents"] as const,
  conversations: ["conversations"] as const,
  auth: ["auth"] as const,
  authMe: ["auth", "me"] as const,
} as const;
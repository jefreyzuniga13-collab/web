import { getUserConnection } from "@/Services/signalr/connections";

// Exponer acciones mínimas del users hub.
export function offNewContact() {
  getUserConnection()?.off("newContactValidation");
}
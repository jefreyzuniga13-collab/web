// Definir estados válidos de conversación.
export const CONVERSATION_STATUS = {
  BOT: "Bot",
  HUMAN: "Human",
  CLOSED: "Closed",
  INCOMPLETE: "Incomplete",
} as const;

// Derivar tipo a partir de los valores.
export type ConversationStatusType =
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];

// Definir opciones de UI asociadas a estados.
export const CONVERSATION_STATUS_OPTIONS: {
  value: ConversationStatusType;
  label: string;
  color: string;
}[] = [
  {
    value: CONVERSATION_STATUS.CLOSED,
    label: "Cerrar",
    color: "closed",
  },
  {
    value: CONVERSATION_STATUS.HUMAN,
    label: "Asignar",
    color: "human",
  },
];

// Validar si un valor es estado válido.
export function isConversationStatus(value: unknown): value is ConversationStatusType {
  return Object.values(CONVERSATION_STATUS).includes(
    value as ConversationStatusType
  );
}

// Normalizar valor externo a estado válido.
export function toConversationStatus(
  value: unknown,
  fallback: ConversationStatusType = CONVERSATION_STATUS.BOT
): ConversationStatusType {
  return isConversationStatus(value) ? value : fallback;
}
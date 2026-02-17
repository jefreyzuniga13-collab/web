export const SystemParamType = {
  AsignarConversacionesEntreAgentes: 1097,
} as const;

// Para usar el tipo en tus interfaces:
export type SystemParamType = typeof SystemParamType[keyof typeof SystemParamType];
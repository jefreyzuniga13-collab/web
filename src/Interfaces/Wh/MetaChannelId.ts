export const CHANNEL = {
  Whatsapp: 1,
  Messenger: 2,
  Instagram: 3,
} as const;

export type ChannelType = typeof CHANNEL[keyof typeof CHANNEL];

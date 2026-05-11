import { Howl } from 'howler';
import notificationMp3 from '@/assets/audio/bellnotification.mp3';
import newChatMp3 from '@/assets/audio/newMessage.mp3';
import closeChatMp3 from '@/assets/audio/closeChat.mp3';

export const notificationSound = new Howl({
  src: [notificationMp3],
  volume: 1,
  preload: true,      // fuerza la carga al arranque
  html5: true         // opcional, para streaming en ciertos navegadores
});

export const newConversationSound = new Howl({
  src: [newChatMp3],
  volume: 1,
  preload: true,
  html5: true,
});

export const closeConversationSound = new Howl({
  src: [closeChatMp3],
  volume: 1,
  preload: true,
  html5: true,
});
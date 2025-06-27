import { Howl } from 'howler';
import notificationMp3 from '@/assets/audio/notification.mp3';

export const notificationSound = new Howl({
  src: [notificationMp3],
  volume: 1,
  preload: true,      // fuerza la carga al arranque
  html5: true         // opcional, para streaming en ciertos navegadores
});
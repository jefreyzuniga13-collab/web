import { useEffect } from "react";
import {
  onPlayNewMessageSound,
  offPlayNewMessageSound,
} from "@/Services/signalr/signalr";
import { notificationSound } from "@/Utils/sound";
import { selectUserId } from "@/Context/Slices/Auth/authSlice";
import { useSelector } from "react-redux";

export function GlobalSoundNotifier() {
  const userId = useSelector(selectUserId);

  useEffect(() => {
    const playIfNotMine = (senderUserId: number) => {
      if (Number(senderUserId) === Number(userId)) return;

      try {
        notificationSound.stop(); // reinicia si ya estaba sonando
        notificationSound.play(); // reproduce
      } catch {
        // Ignorar errores
      }
    };

    const unsubscribe = onPlayNewMessageSound(playIfNotMine);

    return () => {
      unsubscribe?.();
      offPlayNewMessageSound(playIfNotMine);
    };
  }, [userId]);

  return null;
}
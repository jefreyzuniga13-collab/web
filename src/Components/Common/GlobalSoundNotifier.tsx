import { useEffect, useCallback } from "react";
import { onPlaySound, offPlaySound } from "@/Services/signalr";
import {
  notificationSound,
  newConversationSound,
  closeConversationSound,
} from "@/Utils/sound";
import type { AuthData } from "@/Interfaces/Auth/AuthInterface";

type SoundDto = {
  conversationId: number;
  messageId?: number | null;
  senderUserId?: number | null;
  senderContactId?: number | null;
  kind: "new_conversation" | "message" | "close";
  at?: string | null;
};

export function GlobalSoundNotifier() {
  const authRaw = localStorage.getItem("auth") || "{}";
  const auth = JSON.parse(authRaw) as AuthData;

  const myUserId = Number(auth?.userId ?? 0);
  // const soundEnabled = Boolean(auth?.soundNotifications ?? true);

  const playIfAllowed = useCallback(
    (dto: SoundDto) => {
      // if (!soundEnabled) return;

      if (dto.kind === "new_conversation") {
        newConversationSound.play();
        return;
      }
      if (dto.kind === "close") {
        closeConversationSound.play();
        return;
      }

      notificationSound.play();
    },
    [myUserId
      // , soundEnabled
    ]
  );

  useEffect(() => {
    onPlaySound(playIfAllowed);
    return () => offPlaySound(playIfAllowed);
  }, [playIfAllowed]);

  return null;
}
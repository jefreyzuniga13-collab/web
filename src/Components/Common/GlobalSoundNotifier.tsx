/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'
import { useSignalR } from '@/Context/SignalRContext'
import { notificationSound } from '@/Utils/sound'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface';
import type { AttachmentDto, MessageDto } from '@/Interfaces/Chat/ChatInterfaces';

export function GlobalSoundNotifier() {

    // useEffect(() => {
    //     const unlock = () => {
    
    //         notificationSound.play()

    //         window.removeEventListener('click', unlock)
    //     }

    //     window.addEventListener('click', unlock)
    //     return () => window.removeEventListener('click', unlock)
    // }, [])
  
  const { onNewMessage, offNewMessage } = useSignalR()
    const authRaw = localStorage.getItem('auth') || '{}';
    const { userId } = JSON.parse(authRaw) as AuthData;
    const id = userId as unknown as number;
  
    useEffect(() => {
    const handler = ({ message }: { message: MessageDto; attachments: AttachmentDto[] }) => {
      //sólo si no es tu propio mensaje
      if (message.senderUserId !== id || message.senderContactId != null) {

        notificationSound.play()
       }
    }

    onNewMessage(handler)
    return () => offNewMessage(handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNewMessage, offNewMessage])

  return null
}
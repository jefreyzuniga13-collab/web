import { useEffect }                       from 'react'
import { onPlayNewMessageSound, 
         offPlayNewMessageSound }          from '@/Services/signalr'
import { notificationSound }               from '@/Utils/sound'
import type { AuthData }                   from '@/Interfaces/Auth/AuthInterface'

export function GlobalSoundNotifier() {
  const authRaw = localStorage.getItem('auth') || '{}'
  const { userId: uid } = JSON.parse(authRaw) as AuthData
  const myUserId = Number(uid)

  useEffect(() => {
    const playIfNotMine = (senderUserId: number) => {
      if (senderUserId !== myUserId) {
        notificationSound.play()
      }
    }

    onPlayNewMessageSound(playIfNotMine)
    return () => {
      offPlayNewMessageSound()
    }
  }, [myUserId])

  return null
}
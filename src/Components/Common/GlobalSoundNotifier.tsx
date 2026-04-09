import { useEffect }                       from 'react'
import { onPlayNewMessageSound, 
         offPlayNewMessageSound }          from '@/Services/signalr/signalr'
import { notificationSound }               from '@/Utils/sound'
import { selectUserId } from '@/Context/Slices/Auth/authSlice';
import { useSelector } from 'react-redux';
export function GlobalSoundNotifier() {
   const userId = useSelector(selectUserId);

  useEffect(() => {
    const playIfNotMine = (senderUserId: number) => {
      if (senderUserId !== userId) {
        notificationSound.play()
      }
    }

    onPlayNewMessageSound(playIfNotMine)
    return () => {
      offPlayNewMessageSound()
    }
  }, [userId])

  return null
}
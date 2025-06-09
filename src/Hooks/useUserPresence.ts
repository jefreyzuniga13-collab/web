// src/Hooks/useUserPresence.ts
import { useEffect, useState } from 'react'
import { userService } from '@/Services/User/UserService'
import { presenceConnection } from '@/Services/signalr'
//import type { PresenceDto } from '@/Interfaces/User/UserInterfaces'

export function useUserPresence(userId: number) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  // 1) Fetch inicial vía REST
  useEffect(() => {
    if (!userId) return

    userService.getUserPresence(userId)
      .then(dto => {
        setIsOnline(dto.isOnline)
        setLastOnline(dto.lastOnline ? new Date(dto.lastOnline) : null)
      })
      .catch(console.error)
  }, [userId])

  // 2) Suscripción a eventos SignalR
  useEffect(() => {
    if (!userId) return

    const onOnline = (id: number) => {
      if (id === userId) setIsOnline(true)
    }
    const onOffline = (id: number) => {
      if (id === userId) {
        setIsOnline(false)
        setLastOnline(new Date())
      }
    }

    presenceConnection?.on('UserIsOnline', onOnline)
    presenceConnection?.on('UserIsOffline', onOffline)

    return () => {
      presenceConnection?.off('UserIsOnline', onOnline)
      presenceConnection?.off('UserIsOffline', onOffline)
    }
  }, [userId])

  return { isOnline, lastOnline }
}

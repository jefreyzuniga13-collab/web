// src/Hooks/useUserPresence.ts
import { useEffect, useState } from 'react'
import api from '@/Utils/ApiConfig'
import { presenceConnection } from '@/Services/signalr'

interface PresenceResponse {
  isOnline: boolean
  lastOnline: string | null
}

export function useUserPresence(userId: number) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  // 1) Fetch inicial
  useEffect(() => {
    if (!userId) return
    api.get<PresenceResponse>(`/presence/${userId}`)
      .then(res => {
        setIsOnline(res.data.isOnline)
        setLastOnline(res.data.lastOnline ? new Date(res.data.lastOnline) : null)
      })
      .catch(console.error)
  }, [userId])

  // 2) Suscripción a eventos
  useEffect(() => {
    if (!userId) return
    const onConnect = (id: number) => {
      if (id === userId) setIsOnline(true)
    }
    const onDisconnect = (id: number) => {
      if (id === userId) {
        setIsOnline(false)
        setLastOnline(new Date())
      }
    }

    presenceConnection?.on('UserConnected', onConnect)
    presenceConnection?.on('UserDisconnected', onDisconnect)

    return () => {
      presenceConnection?.off('UserConnected', onConnect)
      presenceConnection?.off('UserDisconnected', onDisconnect)
    }
  }, [userId])

  return { isOnline, lastOnline }
}